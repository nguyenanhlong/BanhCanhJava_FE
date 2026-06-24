import { Product, Driver, ProductReview } from './types';

export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    orderId: 'DH-0999',
    productName: 'Bánh Canh Cá Lóc Đặc Biệt',
    customerName: 'Hoàng Kim Chi',
    rating: 5,
    comment: 'Bánh canh cực kỳ ngon! Sợi bột gạo mềm mịn, nước dùng thanh ngọt thơm nồng củ nén miền Trung giòn rụm.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'rev-2',
    orderId: 'DH-0998',
    productName: 'Bánh Canh Cá Lóc Chiên Giòn',
    customerName: 'Nguyễn Văn Nam',
    rating: 5,
    comment: 'Lần đầu ăn cá lóc chiên giòn thế này, nước súp ngập sả ớt ăn kèm tóp mỡ siêu ấm lòng ngày mát mẻ.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'rev-3',
    orderId: 'DH-0997',
    productName: 'Bánh Quẩy Giòn',
    customerName: 'Trần Thị Mỹ',
    rating: 5,
    comment: 'Quẩy siêu giòn rụm, nhúng nước bánh canh nóng sền sệt ăn béo bùi ngon đỉnh chóp.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'rev-4',
    orderId: 'DH-0996',
    productName: 'Bánh Canh Cá Lóc Hấp Truyền Thống',
    customerName: 'Phan Quốc Bảo',
    rating: 4,
    comment: 'Bánh canh chuẩn vị miền Trung gốc luôn! Thịt cá phi lê tươi ngọt rắc tiêu xay và hành lá thơm phức.',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'bc-01',
    name: 'Bánh Canh Cá Lóc Đặc Biệt',
    description: 'Tô bánh canh đầy đặn đầy đủ cá lóc hấp, cá chiên giòn, đầu lòng cá lóc béo ngậy, kèm trứng cút và chả cua Huế.',
    price: 65000,
    categoryId: 1,
    categoryName: 'Bánh Canh Cá Lóc',
    isBestSeller: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1591814468924-caf7f582d246?w=600&auto=format&fit=crop&q=80',
    preparationTime: 15
  },
  {
    id: 'bc-02',
    name: 'Bánh Canh Cá Lóc Hấp Truyền Thống',
    description: 'Thịt cá lóc phi lê hấp chín ngọt, nước dùng ninh từ xương cá ngọt mát đậm đà chuẩn vị Quảng Trị.',
    price: 45000,
    categoryId: 1,
    categoryName: 'Bánh Canh Cá Lóc',
    isBestSeller: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&auto=format&fit=crop&q=80',
    preparationTime: 10
  },
  {
    id: 'bc-03',
    name: 'Bánh Canh Cá Lóc Chiên Giòn',
    description: 'Sử dụng phi lê cá lóc tẩm bột chiên vàng giòn rụm bên ngoài, bên trong thịt vẫn mềm ngọt mọng nước.',
    price: 45000,
    categoryId: 1,
    categoryName: 'Bánh Canh Cá Lóc',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80',
    preparationTime: 10
  },
  {
    id: 'bc-04',
    name: 'Bánh Canh Đầu Lòng Cá Lóc',
    description: 'Món ăn xa xỉ dành cho tín đồ ẩm thực: Đầu cá lóc béo ngậy cùng bộ lòng cá (bao tử, gan) giòn sần sật.',
    price: 55000,
    categoryId: 1,
    categoryName: 'Bánh Canh Cá Lóc',
    isBestSeller: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    preparationTime: 15
  },
  {
    id: 'bc-05',
    name: 'Bánh Canh Cá Lóc Bột Lọc',
    description: 'Sợi bánh làm từ bột lọc trong suốt, dai ngon sần sật quyện nước dùng sền sệt đậm đà ngập tràn củ nén và hành hoa.',
    price: 45000,
    categoryId: 1,
    categoryName: 'Bánh Canh Cá Lóc',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&auto=format&fit=crop&q=80',
    preparationTime: 10
  },
  {
    id: 'top-01',
    name: 'Chả Cua Huế Thêm',
    description: 'Chả cua quết tay thơm nức, dai ngon đậm đà gia vị miền Trung.',
    price: 15000,
    categoryId: 2,
    categoryName: 'Đồ Ăn Kèm',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=600&auto=format&fit=crop&q=80',
    preparationTime: 5
  },
  {
    id: 'top-02',
    name: 'Bộ Lòng Cá Lóc Thêm',
    description: 'Bao tử cá béo ngậy và gan cá lóc chiên sả ớt, đậm đà giòn rụm.',
    price: 25000,
    categoryId: 2,
    categoryName: 'Đồ Ăn Kèm',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    preparationTime: 5
  },
  {
    id: 'top-03',
    name: 'Bánh Quẩy Giòn',
    description: 'Quẩy giòn rụm, nhúng nước bánh canh ăn siêu ngon cuốn hút.',
    price: 5000,
    categoryId: 2,
    categoryName: 'Đồ Ăn Kèm',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80',
    preparationTime: 3
  },
  {
    id: 'top-04',
    name: 'Trứng Cút (5 Quả)',
    description: 'Trứng cút luộc chín tới bùi bùi béo béo.',
    price: 8000,
    categoryId: 2,
    categoryName: 'Đồ Ăn Kèm',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    preparationTime: 5
  },
  {
    id: 'dr-01',
    name: 'Nước Chè Xanh Huế',
    description: 'Lá chè tươi om chuẩn vị miền Trung mát rượi thanh lọc cơ thể.',
    price: 10000,
    categoryId: 3,
    categoryName: 'Đồ Uống',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    preparationTime: 3
  },
  {
    id: 'dr-02',
    name: 'Nước Sâm Cỏ Ngọt',
    description: 'Sâm cỏ ngọt nhà nấu thanh nhiệt, ngọt nhẹ tự nhiên tốt cho sức khỏe.',
    price: 15000,
    categoryId: 3,
    categoryName: 'Đồ Uống',
    isBestSeller: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&auto=format&fit=crop&q=80',
    preparationTime: 3
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'driver-1',
    name: 'Nguyễn Văn Hùng',
    phone: '0905123456',
    vehicle: 'Wave Alpha (Đỏ) - 43C1-123.45',
    status: 'available',
    isActive: true
  },
  {
    id: 'driver-2',
    name: 'Trần Minh Hải',
    phone: '0978987654',
    vehicle: 'Exciter (Xanh GP) - 75H1-678.90',
    status: 'available',
    isActive: true
  },
  {
    id: 'driver-3',
    name: 'Phan Thanh Bình',
    phone: '0914666888',
    vehicle: 'Sirius (Đen) - 43D2-888.88',
    status: 'busy',
    isActive: true
  },
  {
    id: 'driver-user',
    name: 'Tài xế Nguyễn Hải',
    phone: '0945888999',
    vehicle: 'Dream lùn (Nâu) - 75F1-999.99',
    status: 'available',
    isActive: true
  }
];

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
        dataSource.setUsername("root"); // Default username in XAMPP
        dataSource.setPassword("");     // Default password is empty in XAMPP
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
import javax.persistence.*;

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
    
    @Column(nullable = false)
    private String category; // main, extra, drink
    
    @Column(name = "is_best_seller")
    private Boolean isBestSeller = false;

    @Column(name = "image_url", length = 500)
    private String imageUrl; // URL to the food/topping image
}`
  },
  {
    filename: 'Order.java',
    path: 'com/banhcanhcaloc/model/Order.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.model;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "customer_name", nullable = false)
    private String customerName;
    
    @Column(nullable = false)
    private String phone;
    
    @Column(nullable = false)
    private String address;
    
    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;
    
    @Column(name = "payment_method", nullable = false)
    private String paymentMethod; // cod, momo, vnpay
    
    @Column(name = "payment_status", nullable = false)
    private String paymentStatus; // pending, paid, failed
    
    @Column(nullable = false)
    private String status; // pending, preparing, shipping, completed, cancelled
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "driver_id")
    private Long driverId;
    
    @Column(name = "driver_name")
    private String driverName;
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items;
}`
  },
  {
    filename: 'Driver.java',
    path: 'com/banhcanhcaloc/model/Driver.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.model;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "drivers")
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String phone;
    
    @Column(nullable = false)
    private String vehicle;
    
    @Column(nullable = false)
    private String status; // available, busy, offline
    
    private Double rating = 5.0;
}`
  },
  {
    filename: 'OrderController.java',
    path: 'com/banhcanhcaloc/controller/OrderController.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.controller;

import com.banhcanhcaloc.model.Order;
import com.banhcanhcaloc.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        order.setStatus("pending");
        if (order.getPaymentMethod().equals("cod")) {
            order.setPaymentStatus("pending");
        } else {
            order.setPaymentStatus("paid"); // Simulated card/momo
        }
        return orderRepository.save(order);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/assign-driver")
    public ResponseEntity<Order> assignDriver(@PathVariable Long id, @RequestParam Long driverId, @RequestParam String driverName) {
        return orderRepository.findById(id).map(order -> {
            order.setDriverId(driverId);
            order.setDriverName(driverName);
            order.setStatus("shipping");
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }
}`
  },
  {
    filename: 'DriverController.java',
    path: 'com/banhcanhcaloc/controller/DriverController.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.controller;

import com.banhcanhcaloc.model.Driver;
import com.banhcanhcaloc.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private DriverRepository driverRepository;

    @GetMapping
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @PostMapping
    public Driver registerDriver(@RequestBody Driver driver) {
        driver.setStatus("available");
        return driverRepository.save(driver);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Driver> updateDriverStatus(@PathVariable Long id, @RequestParam String status) {
        return driverRepository.findById(id).map(driver -> {
            driver.setStatus(status);
            return ResponseEntity.ok(driverRepository.save(driver));
        }).orElse(ResponseEntity.notFound().build());
    }
}`
  },
  {
    filename: 'OrderItem.java',
    path: 'com/banhcanhcaloc/model/OrderItem.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.model;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private String productId;
    
    @Column(name = "product_name", nullable = false)
    private String productName;
    
    @Column(nullable = false)
    private Double price;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(length = 500)
    private String toppings; // Đầy đủ chả cua hầm, lòng cá...
}`
  },
  {
    filename: 'ProductRepository.java',
    path: 'com/banhcanhcaloc/repository/ProductRepository.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.repository;

import com.banhcanhcaloc.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(String category);
}`
  },
  {
    filename: 'OrderRepository.java',
    path: 'com/banhcanhcaloc/repository/OrderRepository.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.repository;

import com.banhcanhcaloc.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
}`
  },
  {
    filename: 'DriverRepository.java',
    path: 'com/banhcanhcaloc/repository/DriverRepository.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.repository;

import com.banhcanhcaloc.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
}`
  },
  {
    filename: 'ProductController.java',
    path: 'com/banhcanhcaloc/controller/ProductController.java',
    lang: 'java',
    content: `package com.banhcanhcaloc.controller;

import com.banhcanhcaloc.model.Product;
import com.banhcanhcaloc.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/category/{category}")
    public List<Product> getProductsByCategory(@PathVariable String category) {
        return productRepository.findByCategory(category);
    }

    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setDescription(productDetails.getDescription());
            product.setPrice(productDetails.getPrice());
            product.setCategory(productDetails.getCategory());
            product.setIsBestSeller(productDetails.getIsBestSeller());
            product.setImageUrl(productDetails.getImageUrl());
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id).map(product -> {
            productRepository.delete(product);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}`
  },
  {
    filename: 'application.properties',
    path: 'src/main/resources/application.properties',
    lang: 'properties',
    content: `# ===================================================================
# SPRING BOOT DATABASE CONFIGURATION (MySQL via XAMPP Control Panel)
# ===================================================================

# 1. Database Connection Properties
spring.datasource.url=jdbc:mysql://localhost:3306/banhcanh_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&useUnicode=yes&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# 2. Hibernate / JPA Configuration
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# 3. Server Port Customization
server.port=8080

# 4. Encoding settings to prevent Vietnamese font breakage
spring.http.encoding.charset=UTF-8
spring.http.encoding.enabled=true
spring.http.encoding.force=true`
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
  \`full_name\` varchar(255) DEFAULT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`address\` text,
  \`avatar_url\` varchar(500) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`last_login\` datetime DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG CATEGORIES
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`slug\` varchar(100) NOT NULL UNIQUE,
  \`description\` text,
  \`image_url\` varchar(500) DEFAULT NULL,
  \`display_order\` int(11) DEFAULT '0',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG DRIVERS
CREATE TABLE IF NOT EXISTS \`drivers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`phone\` varchar(20) NOT NULL UNIQUE,
  \`vehicle\` varchar(100) DEFAULT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'available',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG DINING_TABLES
CREATE TABLE IF NOT EXISTS \`dining_tables\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`table_number\` varchar(20) NOT NULL UNIQUE,
  \`capacity\` int(11) DEFAULT '4',
  \`position\` varchar(100) DEFAULT NULL,
  \`status\` varchar(20) DEFAULT 'available',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG MATERIALS
CREATE TABLE IF NOT EXISTS \`materials\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`unit\` varchar(50) NOT NULL,
  \`current_quantity\` double DEFAULT '0',
  \`min_quantity\` double DEFAULT '0',
  \`unit_price\` double DEFAULT '0',
  \`supplier\` varchar(255) DEFAULT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG PROMOTIONS
CREATE TABLE IF NOT EXISTS \`promotions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(50) NOT NULL UNIQUE,
  \`name\` varchar(255) NOT NULL,
  \`description\` text,
  \`discount_type\` varchar(20) NOT NULL DEFAULT 'percentage',
  \`discount_value\` double NOT NULL,
  \`min_order_amount\` double DEFAULT '0',
  \`max_discount\` double DEFAULT '0',
  \`usage_limit\` int(11) DEFAULT '0',
  \`used_count\` int(11) DEFAULT '0',
  \`start_date\` datetime NOT NULL,
  \`end_date\` datetime NOT NULL,
  \`is_active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG PRODUCTS
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`description\` text,
  \`price\` double NOT NULL,
  \`category_id\` int(11) DEFAULT NULL,
  \`category_name\` varchar(50) DEFAULT NULL,
  \`is_best_seller\` tinyint(1) DEFAULT '0',
  \`is_available\` tinyint(1) DEFAULT '1',
  \`image_url\` varchar(500) DEFAULT NULL,
  \`preparation_time\` int(11) DEFAULT '10',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_product_category\` (\`category_id\`),
  CONSTRAINT \`fk_product_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG PRODUCT_OPTIONS
CREATE TABLE IF NOT EXISTS \`product_options\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`name\` varchar(100) NOT NULL,
  \`option_group\` varchar(50) DEFAULT 'topping',
  \`price\` double DEFAULT '0',
  \`is_required\` tinyint(1) DEFAULT '0',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`display_order\` int(11) DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`fk_option_product\` (\`product_id\`),
  CONSTRAINT \`fk_option_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG PRODUCT_MATERIALS
CREATE TABLE IF NOT EXISTS \`product_materials\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`product_id\` int(11) NOT NULL,
  \`material_id\` int(11) NOT NULL,
  \`quantity\` double NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_product_material\` (\`product_id\`, \`material_id\`),
  KEY \`fk_pm_material\` (\`material_id\`),
  CONSTRAINT \`fk_pm_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_pm_material\` FOREIGN KEY (\`material_id\`) REFERENCES \`materials\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG ORDERS
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) DEFAULT NULL,
  \`customer_name\` varchar(255) NOT NULL,
  \`phone\` varchar(20) NOT NULL,
  \`address\` text,
  \`table_id\` int(11) DEFAULT NULL,
  \`order_type\` varchar(20) DEFAULT 'delivery',
  \`subtotal\` double NOT NULL DEFAULT '0',
  \`discount_id\` int(11) DEFAULT NULL,
  \`discount_amount\` double DEFAULT '0',
  \`shipping_fee\` double DEFAULT '0',
  \`total_amount\` double NOT NULL,
  \`payment_method\` varchar(50) NOT NULL DEFAULT 'cash',
  \`payment_status\` varchar(50) NOT NULL DEFAULT 'pending',
  \`status\` varchar(50) NOT NULL DEFAULT 'pending',
  \`driver_id\` int(11) DEFAULT NULL,
  \`notes\` text,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_order_user\` (\`user_id\`),
  KEY \`fk_order_table\` (\`table_id\`),
  KEY \`fk_order_driver\` (\`driver_id\`),
  KEY \`fk_order_promo\` (\`discount_id\`),
  CONSTRAINT \`fk_order_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_order_table\` FOREIGN KEY (\`table_id\`) REFERENCES \`dining_tables\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_order_driver\` FOREIGN KEY (\`driver_id\`) REFERENCES \`drivers\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_order_promo\` FOREIGN KEY (\`discount_id\`) REFERENCES \`promotions\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG ORDER_ITEMS
CREATE TABLE IF NOT EXISTS \`order_items\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`order_id\` int(11) NOT NULL,
  \`product_id\` int(11) DEFAULT NULL,
  \`product_name\` varchar(255) NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`price\` double NOT NULL,
  \`options_text\` varchar(500) DEFAULT NULL,
  \`noodle_type\` varchar(50) DEFAULT NULL,
  \`notes\` varchar(255) DEFAULT NULL,
  \`subtotal\` double NOT NULL DEFAULT '0',
  PRIMARY KEY (\`id\`),
  KEY \`fk_item_order\` (\`order_id\`),
  KEY \`fk_item_product\` (\`product_id\`),
  CONSTRAINT \`fk_item_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_item_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG ORDER_STATUS_HISTORY
CREATE TABLE IF NOT EXISTS \`order_status_history\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`order_id\` int(11) NOT NULL,
  \`old_status\` varchar(50) DEFAULT NULL,
  \`new_status\` varchar(50) NOT NULL,
  \`changed_by\` int(11) DEFAULT NULL,
  \`notes\` text,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_history_order\` (\`order_id\`),
  CONSTRAINT \`fk_history_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. BẢNG PAYMENT_TRANSACTIONS
CREATE TABLE IF NOT EXISTS \`payment_transactions\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`order_id\` int(11) NOT NULL,
  \`transaction_code\` varchar(100) DEFAULT NULL,
  \`payment_method\` varchar(50) NOT NULL,
  \`amount\` double NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'pending',
  \`gateway\` varchar(50) DEFAULT NULL,
  \`gateway_response\` text,
  \`paid_at\` datetime DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_payment_order\` (\`order_id\`),
  CONSTRAINT \`fk_payment_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. BẢNG REVIEWS
CREATE TABLE IF NOT EXISTS \`reviews\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`product_id\` int(11) NOT NULL,
  \`order_id\` int(11) DEFAULT NULL,
  \`rating\` tinyint NOT NULL,
  \`comment\` text,
  \`image_url\` varchar(500) DEFAULT NULL,
  \`is_approved\` tinyint(1) DEFAULT '0',
  \`admin_reply\` text,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_review_user\` (\`user_id\`),
  KEY \`fk_review_product\` (\`product_id\`),
  KEY \`fk_review_order\` (\`order_id\`),
  CONSTRAINT \`fk_review_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_review_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_review_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- SEED DATA
INSERT IGNORE INTO \`users\` (\`username\`, \`password\`, \`email\`, \`role\`, \`full_name\`) VALUES
('superadmin', '$2b$10$example_hash_super_admin', 'superadmin@banhcanh.com', 'super_admin', 'Super Admin'),
('admin', '$2b$10$example_hash_admin', 'admin@banhcanh.com', 'admin', 'Quản lý'),
('customer', '$2b$10$example_hash_customer', 'customer@gmail.com', 'customer', 'Khách hàng');

INSERT INTO \`categories\` (\`name\`, \`slug\`, \`display_order\`) VALUES
('Bánh Canh Cá Lóc', 'banh-canh-ca-loc', 1),
('Đồ Ăn Kèm', 'do-an-kem', 2),
('Đồ Uống', 'do-uong', 3),
('Tráng Miệng', 'trang-mieng', 4),
('Combo', 'combo', 5);

INSERT INTO \`drivers\` (\`name\`, \`phone\`, \`vehicle\`, \`status\`) VALUES
('Nguyễn Văn A', '0901234567', '59-X1 123.45', 'available'),
('Trần Văn B', '0912345678', '59-X2 678.90', 'available');

INSERT INTO \`dining_tables\` (\`table_number\`, \`capacity\`, \`position\`) VALUES
('A1', 2, 'Tầng 1 - Gần cửa'),
('A2', 4, 'Tầng 1 - Giữa'),
('A3', 4, 'Tầng 1 - Góc'),
('B1', 6, 'Tầng 2 - Phòng lạnh');

INSERT INTO \`materials\` (\`name\`, \`unit\`, \`current_quantity\`, \`min_quantity\`, \`unit_price\`) VALUES
('Cá lóc', 'kg', 10, 2, 80000),
('Bột gạo', 'kg', 15, 5, 25000),
('Bột năng', 'kg', 10, 3, 20000),
('Hành lá', 'kg', 2, 0.5, 30000),
('Rau răm', 'kg', 1, 0.3, 25000),
('Chả cá', 'kg', 5, 1, 120000),
('Trứng cút', 'cái', 100, 30, 2000);

INSERT INTO \`promotions\` (\`code\`, \`name\`, \`discount_type\`, \`discount_value\`, \`min_order_amount\`, \`start_date\`, \`end_date\`) VALUES
('WELCOME10', 'Giảm 10% khách mới', 'percentage', 10, 100000, '2026-01-01', '2026-12-31'),
('FREESHIP', 'Free ship đơn 150k', 'fixed_amount', 20000, 150000, '2026-01-01', '2026-12-31');
`;

export const FRONTEND_INTEGRATION_FILES = [
  {
    filename: 'api.ts',
    path: 'src/services/api.ts',
    lang: 'typescript',
    content: `// ===================================================================
// FRONTEND API SERVICE FOR SPRING BOOT BACKEND (React -> Spring Boot)
// ===================================================================

const BASE_URL = 'http://localhost:8080/api';

// Định nghĩa kiểu dữ liệu đồng bộ với Backend
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'extra' | 'drink';
  isBestSeller: boolean;
  imageUrl: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  toppings?: string; // Tên các topping đi kèm dưới dạng chuỗi phân tách
}

export interface Order {
  id?: number;
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'pending' | 'shipping' | 'completed' | 'cancelled';
  createdAt?: string;
  driverId?: number;
  driverName?: string;
  items: OrderItem[];
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
  rating: number;
}

export const ApiService = {
  // 1. API SẢN PHẨM (Products)
  async getProducts(): Promise<Product[]> {
    const res = await fetch(\`\${BASE_URL}/products\`);
    if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
    return res.json();
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const res = await fetch(\`\${BASE_URL}/products/category/\${category}\`);
    if (!res.ok) throw new Error('Không thể tải sản phẩm theo danh mục');
    return res.json();
  },

  // 2. API ĐƠN HÀNG (Orders)
  async getOrders(): Promise<Order[]> {
    const res = await fetch(\`\${BASE_URL}/orders\`);
    if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng');
    return res.json();
  },

  async createOrder(order: Order): Promise<Order> {
    const res = await fetch(\`\${BASE_URL}/orders\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Không thể tạo đơn hàng');
    return res.json();
  },

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const res = await fetch(\`\${BASE_URL}/orders/\${orderId}/status?status=\${status}\`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng');
    return res.json();
  },

  async assignDriverToOrder(orderId: number, driverId: number): Promise<Order> {
    const res = await fetch(\`\${BASE_URL}/orders/\${orderId}/assign-driver/\${driverId}\`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Không thể phân công tài xế');
    return res.json();
  },

  // 3. API TÀI XẾ (Drivers)
  async getDrivers(): Promise<Driver[]> {
    const res = await fetch(\`\${BASE_URL}/drivers\`);
    if (!res.ok) throw new Error('Không thể tải danh sách tài xế');
    return res.json();
  }
};`
  },
  {
    filename: 'HowToIntegrate.md',
    path: 'DOCS_GUIDE/HowToIntegrate.md',
    lang: 'markdown',
    content: `# HƯỚNG DẪN THAY THẾ LOCALSTORAGE SANG CALL API SPRING BOOT

Dưới đây là các bước cụ thể để cập nhật luồng dữ liệu của ứng dụng sang gọi API thực tế:

## Bước 1: Cho phép CORS bên Backend Spring Boot
Đảm bảo ở Controller của Spring Boot đã được gắn anotation \`@CrossOrigin(origins = "*")\` hoặc cấu hình cấu trúc CORS để Frontend React chạy ở port khác có thể gọi được.
*(Tất cả file Controller đã được tích hợp sẵn cấu hình CORS ở tab Java Backend!)*

## Bước 2: Tích hợp ApiService vào React Component (App.tsx)
Thay thế việc đọc/ghi trực tiếp vào \`localStorage\` bằng cách sử dụng React state kết hợp với \`useEffect\` để gọi API bất đồng bộ.

\`\`\`tsx
import { useEffect, useState } from 'react';
import { ApiService, Product, Order } from './services/api';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Tải dữ liệu ban đầu từ Backend thay vì banhcanh_orders từ localStorage
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [productList, orderList] = await Promise.all([
          ApiService.getProducts(),
          ApiService.getOrders()
        ]);
        setProducts(productList);
        setOrders(orderList);
      } catch (error) {
        console.error("Lỗi khi kết nối Spring Boot Backend:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Hàm đặt hàng: Thay thế việc ghi trực tiếp vào localStorage
  const handleCheckout = async (orderData) => {
    try {
      const createdOrder = await ApiService.createOrder(orderData);
      setOrders(prev => [createdOrder, ...prev]);
      alert("Đặt bánh canh cá lóc hảo hạng thành công!");
    } catch (err) {
      alert("Đặt hàng thất bại: " + err.message);
    }
  };

  // 3. Hàm phân công Shipper hoặc cập nhật trạng thái đơn
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const updated = await ApiService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch (err) {
      alert("Cập nhật trạng thái thất bại: " + err.message);
    }
  };

  // ...
}
\`\`\`

## Bước 3: Kiểm tra Network và khởi chạy đồng thời song song
1. Chạy Backend Spring Boot ở cổng \`8080\` (Port mặc định).
2. Chạy Frontend React (npm run dev).
3. Mở F12 chọn tab **Network** để xem luồng truyền nhận JSON thực tế (HTTP GET/POST/PUT) siêu trực quan!`
  }
];
