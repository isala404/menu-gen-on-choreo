package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var db *sql.DB

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using environment variables")
	}

	connStr := os.Getenv("DATABASE_URL")
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Successfully connected to the database")

	createTables(db)

	r := gin.Default()

	api := r.Group("/api")
	{
		api.POST("/menus", createMenu)
		api.POST("/menus/:id/process", processMenu)
		api.GET("/menus/:id", getMenu)
		api.POST("/menu-items/:id/regenerate", regenerateMenuItem)
	}

	r.Run(":8080")
}
