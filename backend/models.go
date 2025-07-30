package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Menu struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Status            string     `gorm:"size:20;not null" json:"status"` // PENDING, PROCESSING, COMPLETED, FAILED
	OriginalImageData []byte     `gorm:"type:bytea" json:"-"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	Items             []MenuItem `gorm:"foreignKey:MenuID" json:"items"`
	Error             string     `json:"error,omitempty"`
}

func (m *Menu) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type MenuItem struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	MenuID             uuid.UUID `gorm:"type:uuid;not null" json:"menu_id"`
	ItemText           string    `gorm:"type:text;not null" json:"item_text"`
	ItemPrice          string    `gorm:"size:20" json:"item_price"`
	Description        string    `gorm:"type:text" json:"description,omitempty"`
	EstimatedCalories  int       `gorm:"default:0" json:"estimated_calories,omitempty"`
	GeneratedImageData []byte    `gorm:"type:bytea" json:"-"`
	GenerationPrompt   string    `gorm:"type:text" json:"-"` // Don't expose in JSON
	CreatedAt          time.Time `json:"created_at"`
}

func (mi *MenuItem) BeforeCreate(tx *gorm.DB) error {
	if mi.ID == uuid.Nil {
		mi.ID = uuid.New()
	}
	return nil
}

// Response models
type MenuResponse struct {
	ID        uuid.UUID          `json:"id"`
	Status    string             `json:"status"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
	Items     []MenuItemResponse `json:"items"`
	Error     string             `json:"error,omitempty"`
}

type MenuItemResponse struct {
	ID                 uuid.UUID `json:"id"`
	ItemText           string    `json:"item_text"`
	ItemPrice          string    `json:"item_price"`
	Description        string    `json:"description,omitempty"`
	EstimatedCalories  int       `json:"estimated_calories,omitempty"`
	GeneratedImageData string    `json:"generated_image_data,omitempty"` // base64 encoded
	CreatedAt          time.Time `json:"created_at"`
}

// OpenAI OCR response structure
type OCRResponse struct {
	Items []OCRItem `json:"items"`
}

type OCRItem struct {
	ItemText  string `json:"item_text"`
	ItemPrice string `json:"item_price"`
}
