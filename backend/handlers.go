package main

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func createMenu(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image upload failed"})
		return
	}

	filename := filepath.Base(file.Filename)
	id := uuid.New().String()
	dest := filepath.Join("uploads", id+"_"+filename)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image"})
		return
	}

	var menuID string
	err = db.QueryRow("INSERT INTO menus (status, original_image_url) VALUES ($1, $2) RETURNING id", "PENDING", dest).Scan(&menuID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create menu record"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"menu_id": menuID})
}

func processMenu(c *gin.Context) {
	menuID := c.Param("id")
	apiKey := c.GetHeader("Authorization")
	apiKey = strings.TrimPrefix(apiKey, "Bearer ")

	if apiKey == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "OpenAI API key is required"})
		return
	}

	// Get the image path from the database
	var imagePath string
	err := db.QueryRow("SELECT original_image_url FROM menus WHERE id = $1", menuID).Scan(&imagePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "menu not found"})
		return
	}

	go func() {
		// Update menu status to PROCESSING
		_, err := db.Exec("UPDATE menus SET status = $1 WHERE id = $2", "PROCESSING", menuID)
		if err != nil {
			log.Printf("failed to update menu status: %v", err)
			return
		}

		// Extract menu items
		menuItems, err := extractMenuItems(imagePath, apiKey)
		if err != nil {
			log.Printf("failed to extract menu items: %v", err)
			_, err = db.Exec("UPDATE menus SET status = $1 WHERE id = $2", "FAILED", menuID)
			if err != nil {
				log.Printf("failed to update menu status: %v", err)
			}
			return
		}

		// Save menu items and generate images
		for _, item := range menuItems {
			prompt := fmt.Sprintf("Photorealistic food photography of %s, professionally styled on a ceramic plate, restaurant setting", item.ItemText)
			imageURL, err := generateImage(prompt, apiKey)
			if err != nil {
				log.Printf("failed to generate image for %s: %v", item.ItemText, err)
				// Continue to next item
				continue
			}

			_, err = db.Exec("INSERT INTO menu_items (menu_id, item_text, item_price, generated_image_url, generation_prompt) VALUES ($1, $2, $3, $4, $5)", menuID, item.ItemText, item.ItemPrice, imageURL, prompt)
			if err != nil {
				log.Printf("failed to save menu item: %v", err)
			}
		}

		// Update menu status to COMPLETED
		_, err = db.Exec("UPDATE menus SET status = $1 WHERE id = $2", "COMPLETED", menuID)
		if err != nil {
			log.Printf("failed to update menu status: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"status": "processing_started"})
}

type MenuItemResponse struct {
	ID                string `json:"id"`
	Text              string `json:"item_text"`
	Price             string `json:"item_price"`
	GeneratedImageURL string `json:"generated_image_url"`
}

type MenuResponse struct {
	ID     string             `json:"id"`
	Status string             `json:"status"`
	Items  []MenuItemResponse `json:"items"`
}

func getMenu(c *gin.Context) {
	menuID := c.Param("id")

	var menu MenuResponse
	err := db.QueryRow("SELECT id, status FROM menus WHERE id = $1", menuID).Scan(&menu.ID, &menu.Status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "menu not found"})
		return
	}

	rows, err := db.Query("SELECT id, item_text, item_price, generated_image_url FROM menu_items WHERE menu_id = $1", menuID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch menu items"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var item MenuItemResponse
		err := rows.Scan(&item.ID, &item.Text, &item.Price, &item.GeneratedImageURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to scan menu item"})
			return
		}
		menu.Items = append(menu.Items, item)
	}

	c.JSON(http.StatusOK, menu)
}

func regenerateMenuItem(c *gin.Context) {
	itemID := c.Param("id")
	apiKey := c.GetHeader("Authorization")
	apiKey = strings.TrimPrefix(apiKey, "Bearer ")

	if apiKey == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "OpenAI API key is required"})
		return
	}

	var itemText, prompt string
	err := db.QueryRow("SELECT item_text FROM menu_items WHERE id = $1", itemID).Scan(&itemText)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "menu item not found"})
		return
	}

	prompt = fmt.Sprintf("Photorealistic food photography of %s, professionally styled on a ceramic plate, restaurant setting", itemText)
	imageURL, err := generateImage(prompt, apiKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate image"})
		return
	}

	_, err = db.Exec("UPDATE menu_items SET generated_image_url = $1, generation_prompt = $2 WHERE id = $3", imageURL, prompt, itemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update menu item"})
		return
	}

	var item MenuItemResponse
	err = db.QueryRow("SELECT id, item_text, item_price, generated_image_url FROM menu_items WHERE id = $1", itemID).Scan(&item.ID, &item.Text, &item.Price, &item.GeneratedImageURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch menu item"})
		return
	}

	c.JSON(http.StatusOK, item)
}
