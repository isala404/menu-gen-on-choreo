package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

type MenuItem struct {
	ItemText string `json:"item_text"`
	ItemPrice string `json:"item_price"`
}

func extractMenuItems(imagePath string, apiKey string) ([]MenuItem, error) {
	// Read the image file
	imageData, err := os.ReadFile(imagePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read image: %w", err)
	}

	// Encode the image to base64
	encodedImage := base64.StdEncoding.EncodeToString(imageData)

	client := openai.NewClient(apiKey)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4o,
			Messages: []openai.ChatCompletionMessage{
				{
					Role: openai.ChatMessageRoleUser,
					Content: "Analyze this menu image and return a JSON array of objects, where each object contains the item_text and item_price.",
				},
				{
					Role: openai.ChatMessageRoleUser,
					MultiContent: []openai.ChatMessagePart{
						{
							Type: openai.ChatMessagePartTypeImageURL,
							ImageURL: &openai.ChatMessageImageURL{
								URL: "data:image/jpeg;base64," + encodedImage,
							},
						},
					},
				},
			},
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI API: %w", err)
	}

	var menuItems []MenuItem
	err = json.Unmarshal([]byte(resp.Choices[0].Message.Content), &menuItems)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal OpenAI response: %w", err)
	}

	return menuItems, nil
}

func generateImage(prompt string, apiKey string) (string, error) {
	client := openai.NewClient(apiKey)
	resp, err := client.CreateImage(
		context.Background(),
		openai.ImageRequest{
			Prompt: prompt,
			N:      1,
			Size:   openai.CreateImageSize1024x1024,
			Model: openai.CreateImageModelDallE3,

		},
	)
	if err != nil {
		return "", fmt.Errorf("failed to call OpenAI API: %w", err)
	}

	// For now, we'll just return the URL of the first image
	// In a real application, you would download the image and store it
	return resp.Data[0].URL, nil
}
