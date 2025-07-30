package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type Handlers struct {
	db       *gorm.DB
	aiClient *openai.Client
}

func NewHandlers(db *gorm.DB, aiClient *openai.Client) *Handlers {
	return &Handlers{
		db:       db,
		aiClient: aiClient,
	}
}

func (h *Handlers) UploadMenu(c *gin.Context) {
	// Parse multipart form
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}
	defer file.Close()

	// Read file data
	imageData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// Validate file size (10MB limit)
	if len(imageData) > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 10MB"})
		return
	}

	// Create menu record
	menu := Menu{
		Status:            "PENDING",
		OriginalImageData: imageData,
	}

	if err := h.db.Create(&menu).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create menu record"})
		return
	}

	// Start background processing
	go h.processMenu(menu.ID, imageData)

	c.JSON(http.StatusAccepted, gin.H{"menu_id": menu.ID})
}

func (h *Handlers) GetMenu(c *gin.Context) {
	menuID := c.Param("id")

	var menu Menu
	if err := h.db.Preload("Items").First(&menu, "id = ?", menuID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Menu not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch menu"})
		return
	}

	// Convert to response format
	response := MenuResponse{
		ID:        menu.ID,
		Status:    menu.Status,
		CreatedAt: menu.CreatedAt,
		UpdatedAt: menu.UpdatedAt,
		Error:     menu.Error,
		Items:     make([]MenuItemResponse, len(menu.Items)),
	}

	for i, item := range menu.Items {
		response.Items[i] = MenuItemResponse{
			ID:                item.ID,
			ItemText:          item.ItemText,
			ItemPrice:         item.ItemPrice,
			Description:       item.Description,
			EstimatedCalories: item.EstimatedCalories,
			CreatedAt:         item.CreatedAt,
		}

		// Convert image data to base64 if available
		if len(item.GeneratedImageData) > 0 {
			response.Items[i].GeneratedImageData = base64.StdEncoding.EncodeToString(item.GeneratedImageData)
		}
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handlers) processMenu(menuID uuid.UUID, imageData []byte) {
	log.Printf("Starting processing for menu %s", menuID)

	// Update status to processing
	h.db.Model(&Menu{}).Where("id = ?", menuID).Update("status", "PROCESSING")

	// Step 1: Extract text using OpenAI GPT-4o
	menuItems, err := h.extractMenuItems(imageData)
	if err != nil {
		log.Printf("Failed to extract menu items for %s: %v", menuID, err)
		h.db.Model(&Menu{}).Where("id = ?", menuID).Updates(map[string]interface{}{
			"status": "FAILED",
			"error":  fmt.Sprintf("Failed to extract menu items: %v", err),
		})
		return
	}

	if len(menuItems) == 0 {
		h.db.Model(&Menu{}).Where("id = ?", menuID).Updates(map[string]interface{}{
			"status": "FAILED",
			"error":  "No menu items found in the image",
		})
		return
	}

	// Step 2: Save extracted items to database
	var dbItems []MenuItem
	for _, item := range menuItems {
		dbItem := MenuItem{
			MenuID:    menuID,
			ItemText:  item.ItemText,
			ItemPrice: item.ItemPrice,
		}
		dbItems = append(dbItems, dbItem)
	}

	if err := h.db.Create(&dbItems).Error; err != nil {
		log.Printf("Failed to save menu items for %s: %v", menuID, err)
		h.db.Model(&Menu{}).Where("id = ?", menuID).Updates(map[string]interface{}{
			"status": "FAILED",
			"error":  fmt.Sprintf("Failed to save menu items: %v", err),
		})
		return
	}

	// Step 3: Generate images for each item
	h.generateImagesForItems(menuID, dbItems)

	// Update status to completed
	h.db.Model(&Menu{}).Where("id = ?", menuID).Update("status", "COMPLETED")
	log.Printf("Completed processing for menu %s", menuID)
}

func (h *Handlers) extractMenuItems(imageData []byte) ([]OCRItem, error) {
	// Encode image to base64
	base64Image := base64.StdEncoding.EncodeToString(imageData)

	resp, err := h.aiClient.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4o,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful assistant that extracts menu items from restaurant menus. Return the response as a JSON object with an 'items' array, where each item has 'item_text' (required) and 'item_price' (optional) fields.",
				},
				{
					Role: openai.ChatMessageRoleUser,
					MultiContent: []openai.ChatMessagePart{
						{
							Type: openai.ChatMessagePartTypeText,
							Text: "Please extract all menu items from this restaurant menu image. For each item, provide the item name and price if visible. Focus on food and drink items, ignore section headers or descriptions. Return as JSON with format: {\"items\": [{\"item_text\": \"dish name\", \"item_price\": \"$X.XX\"}]}",
						},
						{
							Type: openai.ChatMessagePartTypeImageURL,
							ImageURL: &openai.ChatMessageImageURL{
								URL: fmt.Sprintf("data:image/jpeg;base64,%s", base64Image),
							},
						},
					},
				},
			},
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
			MaxTokens: 1000,
		},
	)

	if err != nil {
		return nil, fmt.Errorf("OpenAI API error: %v", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	// Parse the structured response
	var ocrResponse OCRResponse
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &ocrResponse); err != nil {
		return nil, fmt.Errorf("failed to parse OCR response: %v", err)
	}

	return ocrResponse.Items, nil
}

func (h *Handlers) generateImagesForItems(menuID uuid.UUID, items []MenuItem) {
	for _, item := range items {
		// Generate description and calorie estimate first
		description, calories, err := h.generateItemDescription(item.ItemText)
		if err != nil {
			log.Printf("Failed to generate description for item %s: %v", item.ItemText, err)
			// Continue with image generation even if description fails
		}

		// Generate a descriptive prompt for the dish
		prompt := h.createImagePrompt(item.ItemText)

		// Generate image using DALL-E 3
		imageData, err := h.generateDishImage(prompt)
		if err != nil {
			log.Printf("Failed to generate image for item %s: %v", item.ItemText, err)
			// Update with description and calories even if image fails
			h.db.Model(&MenuItem{}).Where("id = ?", item.ID).Updates(map[string]interface{}{
				"description":        description,
				"estimated_calories": calories,
				"generation_prompt":  prompt,
			})
			continue
		}

		// Update the item with all generated content
		h.db.Model(&MenuItem{}).Where("id = ?", item.ID).Updates(map[string]interface{}{
			"description":          description,
			"estimated_calories":   calories,
			"generated_image_data": imageData,
			"generation_prompt":    prompt,
		})
	}
}

func (h *Handlers) createImagePrompt(itemText string) string {
	// Create a professional food photography prompt
	basePrompt := "A mouth-watering close-up shot of %s, food portrait style, presented on a clean modern plate with elegant plating. Bathed in bright, soft studio light that accentuates the delicious textures. Shallow depth of field with a softly blurred background, creating a professional menu photo look. Extremely detailed, sharp focus, photorealistic, 8K."

	// Clean the item text to focus on the main dish
	cleanText := strings.ToLower(itemText)

	return fmt.Sprintf(basePrompt, cleanText)
}

func (h *Handlers) generateDishImage(prompt string) ([]byte, error) {
	resp, err := h.aiClient.CreateImage(
		context.Background(),
		openai.ImageRequest{
			Prompt:         prompt,
			Model:          openai.CreateImageModelDallE3,
			N:              1,
			Quality:        openai.CreateImageQualityStandard,
			Size:           openai.CreateImageSize1024x1024,
			Style:          openai.CreateImageStyleNatural,
			ResponseFormat: openai.CreateImageResponseFormatB64JSON,
		},
	)

	if err != nil {
		return nil, fmt.Errorf("DALL-E API error: %v", err)
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no image generated")
	}

	// Decode base64 image data
	imageData, err := base64.StdEncoding.DecodeString(resp.Data[0].B64JSON)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image data: %v", err)
	}

	return imageData, nil
}

func (h *Handlers) generateItemDescription(itemText string) (string, int, error) {
	// Create a prompt to generate description and calorie estimate
	prompt := fmt.Sprintf(`For the menu item "%s", provide a brief appetizing description (1-2 sentences) and an estimated calorie count. 
	
	Please respond in JSON format:
	{
		"description": "Brief appetizing description of the dish",
		"estimated_calories": 500
	}
	
	Make the description sound appealing and focus on key ingredients or preparation style. For calorie estimates, use typical restaurant portion sizes.`, itemText)

	resp, err := h.aiClient.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4o,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
			MaxTokens: 150,
		},
	)

	if err != nil {
		return "", 0, fmt.Errorf("OpenAI API error: %v", err)
	}

	if len(resp.Choices) == 0 {
		return "", 0, fmt.Errorf("no response from OpenAI")
	}

	// Parse the response
	var result struct {
		Description       string `json:"description"`
		EstimatedCalories int    `json:"estimated_calories"`
	}

	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		return "", 0, fmt.Errorf("failed to parse description response: %v", err)
	}

	return result.Description, result.EstimatedCalories, nil
}
