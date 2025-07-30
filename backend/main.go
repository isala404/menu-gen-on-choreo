package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sashabaranov/go-openai"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Get configuration from environment
	config := getConfig()

	// Initialize database
	db, err := initDatabase(config)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(&Menu{}, &MenuItem{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize OpenAI client
	aiClient := openai.NewClient(config.OpenAIAPIKey)

	// Initialize handlers
	handlers := NewHandlers(db, aiClient)

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS middleware - allow all origins
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"*"},
	}))

	// API routes
	api := r.Group("/api")
	{
		api.POST("/menus", handlers.UploadMenu)
		api.GET("/menus/:id", handlers.GetMenu)
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Start server
	log.Printf("Starting HTTP server on port %s", config.Port)
	log.Fatal(r.Run(":" + config.Port))
}

type Config struct {
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	SSLEnabled   bool
	OpenAIAPIKey string
	Port         string
}

func getConfig() Config {
	config := Config{
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBUser:       getEnv("DB_USER", "postgres"),
		DBPassword:   getEnv("DB_PASSWORD", ""),
		DBName:       getEnv("DB_NAME", "menugen"),
		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),
		Port:         getEnv("PORT", "8080"),
	}

	// Parse SSL_ENABLED as boolean, default to true
	sslEnabledStr := getEnv("SSL_ENABLED", "true")
	sslEnabled, err := strconv.ParseBool(sslEnabledStr)
	if err != nil {
		config.SSLEnabled = true // Default to true if parsing fails
	} else {
		config.SSLEnabled = sslEnabled
	}

	// Validate required fields
	if config.OpenAIAPIKey == "" {
		log.Fatal("OPENAI_API_KEY environment variable is required")
	}

	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func initDatabase(config Config) (*gorm.DB, error) {
	sslMode := "require"
	if !config.SSLEnabled {
		sslMode = "disable"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		config.DBHost,
		config.DBUser,
		config.DBPassword,
		config.DBName,
		config.DBPort,
		sslMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
