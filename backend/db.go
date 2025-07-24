package main

import (
	"database/sql"
	"log"
)

func createTables(db *sql.DB) {
	createMenusTable := `
	CREATE TABLE IF NOT EXISTS menus (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		status VARCHAR(20) NOT NULL,
		original_image_url VARCHAR(255),
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);`

	_, err := db.Exec(createMenusTable)
	if err != nil {
		log.Fatal(err)
	}

	createMenuItemsTable := `
	CREATE TABLE IF NOT EXISTS menu_items (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		menu_id UUID NOT NULL,
		item_text TEXT NOT NULL,
		item_price VARCHAR(20),
		generated_image_url VARCHAR(255),
		generation_prompt TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		FOREIGN KEY (menu_id) REFERENCES menus(id)
	);`

	_, err = db.Exec(createMenuItemsTable)
	if err != nil {
		log.Fatal(err)
	}
}
