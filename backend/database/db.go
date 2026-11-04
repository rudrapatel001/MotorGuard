package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	connStr := "user=motorguard password=supersecretpassword dbname=motorguard_db host=localhost port=5432 sslmode=disable"
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Cannot connect to database:", err)
	}
	fmt.Println("Connected to PostgreSQL successfully!")

	// Trigger the automated migrations
	RunMigrations()
}
