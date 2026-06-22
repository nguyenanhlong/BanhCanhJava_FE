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
    category: 'main',
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1591814468924-caf7f582d246?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'bc-02',
    name: 'Bánh Canh Cá Lóc Hấp Truyền Thống',
    description: 'Thịt cá lóc phi lê hấp chín ngọt, nước dùng ninh từ xương cá ngọt mát đậm đà chuẩn vị Quảng Trị.',
    price: 45000,
    category: 'main',
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'bc-03',
    name: 'Bánh Canh Cá Lóc Chiên Giòn',
    description: 'Sử dụng phi lê cá lóc tẩm bột chiên vàng giòn rụm bên ngoài, bên trong thịt vẫn mềm ngọt mọng nước.',
    price: 45000,
    category: 'main',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'bc-04',
    name: 'Bánh Canh Đầu Lòng Cá Lóc',
    description: 'Món ăn xa xỉ dành cho tín đồ ẩm thực: Đầu cá lóc béo ngậy cùng bộ lòng cá (bao tử, gan) giòn sần sật.',
    price: 55000,
    category: 'main',
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'bc-05',
    name: 'Bánh Canh Cá Lóc Bột Lọc',
    description: 'Sợi bánh làm từ bột lọc trong suốt, dai ngon sần sật quyện nước dùng sền sệt đậm đà ngập tràn củ nén và hành hoa.',
    price: 45000,
    category: 'main',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'top-01',
    name: 'Chả Cua Huế Thêm',
    description: 'Chả cua quết tay thơm nức, dai ngon đậm đà gia vị miền Trung.',
    price: 15000,
    category: 'extra',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'top-02',
    name: 'Bộ Lòng Cá Lóc Thêm',
    description: 'Bao tử cá béo ngậy và gan cá lóc chiên sả ớt, đậm đà giòn rụm.',
    price: 25000,
    category: 'extra',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'top-03',
    name: 'Bánh Quẩy Giòn',
    description: 'Quẩy giòn rụm, nhúng nước bánh canh ăn siêu ngon cuốn hút.',
    price: 5000,
    category: 'extra',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'top-04',
    name: 'Trứng Cút (5 Quả)',
    description: 'Trứng cút luộc chín tới bùi bùi béo béo.',
    price: 8000,
    category: 'extra',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'dr-01',
    name: 'Nước Chè Xanh Huế',
    description: 'Lá chè tươi om chuẩn vị miền Trung mát rượi thanh lọc cơ thể.',
    price: 10000,
    category: 'drink',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'dr-02',
    name: 'Nước Sâm Cỏ Ngọt',
    description: 'Sâm cỏ ngọt nhà nấu thanh nhiệt, ngọt nhẹ tự nhiên tốt cho sức khỏe.',
    price: 15000,
    category: 'drink',
    isBestSeller: false,
    image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'driver-1',
    name: 'Nguyễn Văn Hùng',
    phone: '0905123456',
    vehicle: 'Wave Alpha (Đỏ) - 43C1-123.45',
    status: 'available',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'driver-2',
    name: 'Trần Minh Hải',
    phone: '0978987654',
    vehicle: 'Exciter (Xanh GP) - 75H1-678.90',
    status: 'available',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'driver-3',
    name: 'Phan Thanh Bình',
    phone: '0914666888',
    vehicle: 'Sirius (Đen) - 43D2-888.88',
    status: 'busy',
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'driver-user',
    name: 'Tài xế Nguyễn Hải',
    phone: '0945888999',
    vehicle: 'Dream lùn (Nâu) - 75F1-999.99',
    status: 'available',
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150'
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

export const MYSQL_DATABASE_SQL = `-- --------------------------------------------------------
-- Tên Database: banhcanh_db
-- Thiết kế kết nối với MySQL qua XAMPP Control Panel
-- --------------------------------------------------------

CREATE DATABASE IF NOT EXISTS \`banhcanh_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`banhcanh_db\`;

-- 1. BẢNG PRODUCTS (Sản phẩm)
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`description\` text COLLATE utf8mb4_unicode_ci,
  \`price\` double NOT NULL,
  \`category\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`is_best_seller\` tinyint(1) DEFAULT '0',
  \`image_url\` varchar(500) COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG DRIVERS (Tài xế)
CREATE TABLE IF NOT EXISTS \`drivers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`phone\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  \`vehicle\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`status\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  \`rating\` double DEFAULT '5.0',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG ORDERS (Đơn hàng)
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`customer_name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`phone\` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`address\` text COLLATE utf8mb4_unicode_ci NOT NULL,
  \`total_amount\` double NOT NULL,
  \`payment_method\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`payment_status\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  \`status\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`driver_id\` int(11) DEFAULT NULL,
  \`driver_name\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_order_driver\` (\`driver_id\`),
  CONSTRAINT \`fk_order_driver\` FOREIGN KEY (\`driver_id\`) REFERENCES \`drivers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG ORDER_ITEMS (Chi tiết đơn hàng)
CREATE TABLE IF NOT EXISTS \`order_items\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`order_id\` int(11) NOT NULL,
  \`product_name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`quantity\` int(11) NOT NULL,
  \`price\` double NOT NULL,
  \`noodle_type\` varchar(50) COLLATE utf8mb4_unicode_ci,
  \`notes\` varchar(255) COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (\`id\`),
  KEY \`fk_items_order\` (\`order_id\`),
  CONSTRAINT \`fk_items_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SEED MẪU DỮ LIỆU SẢN PHẨM KHỞI TẠO
INSERT INTO \`products\` (\`name\`, \`description\`, \`price\`, \`category\`, \`is_best_seller\`, \`image_url\`) VALUES
('Bánh Canh Cá Lóc Đặc Biệt', 'Tô bánh canh đầy đặn đầy đủ cá lóc hấp, cá chiên giòn, đầu lòng cá lóc béo ngậy, kèm trứng cút và chả cua Huế.', 65000, 'main', 1, 'https://images.unsplash.com/photo-1591814468924-caf7f582d246?w=600&auto=format&fit=crop&q=80'),
('Bánh Canh Cá Lóc Hấp Truyền Thống', 'Thịt cá lóc phi lê hấp chín ngọt, nước dùng ninh từ xương cá ngọt mát đậm đà chuẩn vị Quảng Trị.', 45000, 'main', 1, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&auto=format&fit=crop&q=80'),
('Bánh Canh Cá Lóc Chiên Giòn', 'Sử dụng phi lê cá lóc tẩm bột chiên vàng giòn rụm bên ngoài, bên trong thịt vẫn mềm ngọt mọng nước.', 45000, 'main', 0, 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80'),
('Bánh Canh Đầu Lòng Cá Lóc', 'Món ăn xa xỉ dành cho tín đồ ẩm thực: Đầu cá lóc béo ngậy cùng bộ lòng cá (bao tử, gan) giòn sần sật.', 55000, 'main', 1, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80'),
('Bánh Canh Cá Lóc Bột Lọc', 'Sợi bánh làm từ bột lọc trong suốt, dai ngon sần sật quyện nước dùng sền sệt đậm đà ngập tràn củ nén và hành hoa.', 45000, 'main', 0, 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=600&auto=format&fit=crop&q=80'),
('Chả Cua Huế Thêm', 'Chả cua quết tay thơm nức, dai ngon đậm đà gia vị miền Trung.', 15000, 'extra', 0, 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=200&auto=format&fit=crop&q=80'),
('Bộ Lòng Cá Lóc Thêm', 'Bao tử cá béo ngậy và gan cá lóc chiên sả ớt, đậm đà giòn rụm.', 25000, 'extra', 0, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80'),
('Bánh Quẩy Giòn', 'Quẩy giòn rụm, nhúng nước bánh canh ăn cực đã.', 5000, 'extra', 0, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200&auto=format&fit=crop&q=80'),
('Trứng Cút (5 Quả)', 'Trứng cút luộc chín tới, bùi béo ngọt.', 8000, 'extra', 0, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80'),
('Nước Chè Xanh Huế', 'Lá chè tươi om chuẩn vị miền Trung mát rượi thanh lọc cơ thể.', 10000, 'drink', 0, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'),
('Sữa Đậu Nành Lá Dứa', 'Sữa đậu nành tự nấu thơm phức hương lá dứa cốt dừa béo ngậy.', 15000, 'drink', 0, 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&auto=format&fit=crop&q=80');

-- 6. SEED TÀI XẾ MẪU
INSERT INTO \`drivers\` (\`name\`, \`phone\`, \`vehicle\`, \`status\`, \`rating\`) VALUES
('Nguyễn Văn Hùng', '0905123456', 'Wave Alpha (Đỏ) - 43C1-123.45', 'available', 4.9),
('Trần Minh Hải', '0978987654', 'Exciter (Xanh GP) - 75H1-678.90', 'available', 4.8),
('Phan Thanh Bình', '0914666888', 'Sirius (Đen) - 43D2-888.88', 'busy', 4.7);
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
