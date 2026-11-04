package database

import (
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations() {
	dbURL := "postgres://motorguard:supersecretpassword@localhost:5432/motorguard_db?sslmode=disable"

	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		log.Fatal("Could not initialize migrations engine: ", err)
	}

	// Apply the .up.sql files
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatal("Failed to run migrations: ", err)
	}

	fmt.Println("Database migrations applied successfully via golang-migrate!")
}
