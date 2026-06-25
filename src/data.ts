export const JAVA_BACKEND_FILES = [
  {
    filename: 'BanhCanhCaLocApplication.java',
    path: 'com/banhcanhcaloc/BanhCanhCaLocApplication.java',
    lang: 'java',
    content: `package com.banhcanhcaloc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BanhCanhCaLocApplication {
    public static void main(String[] args) {
        SpringApplication.run(BanhCanhCaLocApplication.class, args);
        System.out.println("🤖 Bánh Canh Cá Lóc Miền Trung Backend is running under Port 8080!");
    }
}`
  },
  {
    filename: 'DatabaseConfig.java',
    path: 'com/banhcanhcaloc/config/DatabaseConfig.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {
    
    @Bean
    public DataSource mysqlDataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql://localhost:3306/banhcanh_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
        dataSource.setUsername("root");
        dataSource.setPassword("");
        return dataSource;
    }
}`
  },
  {
    filename: 'Product.java',
    path: 'com/banhcanhcaloc/model/Product.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.model;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name", length = 50)
    private String categoryName;

    @Column(name = "is_best_seller")
    private Boolean isBestSeller = false;

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "preparation_time")
    private Integer preparationTime = 10;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}`
  }
];

export const SQL_BACKEND_FILES = [
  {
    filename: 'schema.sql',
    path: 'database/schema.sql',
    lang: 'sql',
    content: `-- Active: 1715052000000@@localhost@3306@banhcanh_db
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    price DOUBLE NOT NULL,
    category_id BIGINT,
    category_name VARCHAR(50),
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    preparation_time INT DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    filename: 'seed.sql',
    path: 'database/seed.sql',
    lang: 'sql',
    content: `INSERT INTO products (name, description, price, category_id, category_name, is_best_seller, image_url, preparation_time) VALUES
    ('Bánh Canh Cá Lóc Đặc Biệt', 'Tô bánh canh đầy đặn...', 65000, 1, 'Bánh Canh Cá Lóc', TRUE, '...', 15);`
  }
];

export const FRONTEND_FILES = [
  {
    filename: 'App.tsx',
    path: 'src/App.tsx',
    lang: 'tsx',
    content: `export default function App() { ... }`
  },
  {
    filename: 'Navbar.tsx',
    path: 'src/components/Navbar.tsx',
    lang: 'tsx',
    content: `export function Navbar() { ... }`
  }
];

export const MYSQL_DATABASE_SQL = `-- =====================================================
-- HỆ THỐNG QUẢN LÝ BÁN BÁNH CANH CÁ LÓC
-- COMPLETE DATABASE SCHEMA - MySQL via XAMPP
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS \`banhcanh_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`banhcanh_db\`;
-- 1. BẢNG USERS
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`username\` varchar(255) NOT NULL UNIQUE,
  \`password\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL UNIQUE,
  \`role\` enum('super_admin','admin','customer') NOT NULL DEFAULT 'customer',
  \`full_name\` varchar(255) DEFAULT NULL, \`phone\` varchar(20) DEFAULT NULL, \`address\` text, \`avatar_url\` varchar(500) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1', \`last_login\` datetime DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP, \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 2. BẢNG CATEGORIES
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`slug\` varchar(100) NOT NULL UNIQUE,
  \`description\` text, \`image_url\` varchar(500) DEFAULT NULL, \`display_order\` int(11) DEFAULT '0',
  \`is_active\` tinyint(1) DEFAULT '1', \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP, \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 3-14: tables for drivers, dining_tables, materials, promotions, products, product_options, product_materials, orders, order_items, order_status_history, payment_transactions, reviews
-- (see full schema in database.sql)
SET FOREIGN_KEY_CHECKS = 1;
`;

export const FRONTEND_INTEGRATION_FILES = [
  {
    filename: 'api.ts',
    path: 'src/services/api.ts',
    lang: 'typescript',
    content: `const BASE_URL = 'https://banhcanhjavabe-production.up.railway.app/api';
export const ApiService = {
  async getProducts() { const res = await fetch(BASE_URL + '/products'); return res.json(); },
  async getOrders() { const res = await fetch(BASE_URL + '/orders'); return res.json(); },
  async createOrder(order: any) { const res = await fetch(BASE_URL + '/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) }); return res.json(); },
  async getDrivers() { const res = await fetch(BASE_URL + '/drivers'); return res.json(); },
};`
  },
  {
    filename: 'HowToIntegrate.md',
    path: 'DOCS_GUIDE/HowToIntegrate.md',
    lang: 'markdown',
    content: `# HƯỚNG DẪN THAY THẾ LOCALSTORAGE SANG CALL API SPRING BOOT\n\n1. Chạy Backend Spring Boot ở cổng 8080\n2. Chạy Frontend React (npm run dev)\n3. Mở F12 tab Network để xem luồng JSON thực tế.`
  }
];
