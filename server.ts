import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Local types locally defined or loaded
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'extra' | 'drink';
  isBestSeller: boolean;
  image: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
  rating: number;
  avatar: string;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    noodleType?: string;
    notes?: string;
  }[];
  totalAmount: number;
  paymentMethod: 'cod' | 'momo' | 'vnpay' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: 'pending' | 'preparing' | 'shipping' | 'completed' | 'cancelled';
  createdAt: string;
  driverId?: string;
  driverName?: string;
  etaMinutes?: number;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-Memory Database
  const products: Product[] = [
    {
      id: 'bc-01',
      name: 'Bánh Canh Cá Lóc Đặc Biệt',
      description: 'Tô bánh canh đầy đặn đầy đủ cá lóc hấp, cá chiên giòn, đầu lòng cá lóc béo ngậy, kèm trứng cút và chả cua Huế.',
      price: 65000,
      category: 'main',
      isBestSeller: true,
      image: '🍲'
    },
    {
      id: 'bc-02',
      name: 'Bánh Canh Cá Lóc Hấp Truyền Thống',
      description: 'Thịt cá lóc phi lê hấp chín ngọt, nước dùng ninh từ xương cá ngọt mát đậm đà chuẩn vị Quảng Trị.',
      price: 45000,
      category: 'main',
      isBestSeller: true,
      image: '🥣'
    },
    {
      id: 'bc-03',
      name: 'Bánh Canh Cá Lóc Chiên Giòn',
      description: 'Sử dụng phi lê cá lóc tẩm bột chiên vàng giòn rụm bên ngoài, bên trong thịt vẫn mềm ngọt mọng nước.',
      price: 45000,
      category: 'main',
      isBestSeller: false,
      image: '🍤'
    },
    {
      id: 'bc-04',
      name: 'Bánh Canh Đầu Lòng Cá Lóc',
      description: 'Món ăn xa xỉ dành cho tín đồ ẩm thực: Đầu cá lóc béo ngậy cùng bộ lòng cá (bao tử, gan) giòn sần sật.',
      price: 55000,
      category: 'main',
      isBestSeller: true,
      image: '🐟'
    },
    {
      id: 'bc-05',
      name: 'Bánh Canh Cá Lóc Bột Lọc',
      description: 'Sợi bánh làm từ bột lọc trong suốt, dai ngon sần sật quyện nước dùng sền sệt đậm đà ngập tràn củ nén và hành hoa.',
      price: 45000,
      category: 'main',
      isBestSeller: false,
      image: '🍜'
    },
    {
      id: 'top-01',
      name: 'Chả Cua Huế Thêm',
      description: 'Chả cua quết tay thơm nức, dai ngon đậm đà gia vị miền Trung.',
      price: 15000,
      category: 'extra',
      isBestSeller: false,
      image: '🦀'
    },
    {
      id: 'top-02',
      name: 'Bộ Lòng Cá Lóc Thêm',
      description: 'Bao tử cá béo ngậy và gan cá lóc chiên sả ớt, đậm đà giòn rụm.',
      price: 25000,
      category: 'extra',
      isBestSeller: false,
      image: '🍢'
    },
    {
      id: 'top-03',
      name: 'Bánh Quẩy Giòn',
      description: 'Quẩy giòn rụm, nhúng nước bánh canh ăn cực đã.',
      price: 5000,
      category: 'extra',
      isBestSeller: false,
      image: '🥖'
    },
    {
      id: 'top-04',
      name: 'Trứng Cút (5 Quả)',
      description: 'Trứng cút luộc chín tới bùi bùi béo béo.',
      price: 8000,
      category: 'extra',
      isBestSeller: false,
      image: '🥚'
    },
    {
      id: 'dr-01',
      name: 'Nước Chè Xanh Huế',
      description: 'Lá chè tươi om chuẩn vị miền Trung mát rượi thanh lọc cơ thể.',
      price: 10000,
      category: 'drink',
      isBestSeller: false,
      image: '🍵'
    },
    {
      id: 'dr-02',
      name: 'Nước Sâm Cỏ Ngọt',
      description: 'Sâm cỏ ngọt nhà nấu thanh nhiệt, ngọt nhẹ tự nhiên tốt cho sức khỏe.',
      price: 15000,
      category: 'drink',
      isBestSeller: false,
      image: '🥤'
    }
  ];

  const drivers: Driver[] = [
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
    }
  ];

  const orders: Order[] = [
    {
      id: 'DH-1001',
      customerName: 'Lê Thanh Vy',
      phone: '0943221100',
      address: '24 Lê Lợi, TP. Huế',
      items: [
        { productName: 'Bánh Canh Cá Lóc Đặc Biệt', quantity: 2, price: 65000, noodleType: 'Bột gạo', notes: 'Cay vừa, nhiều hành' },
        { productName: 'Bánh Quẩy Giòn', quantity: 2, price: 5000 },
        { productName: 'Nước Sâm Cỏ Ngọt', quantity: 2, price: 15000 }
      ],
      totalAmount: 170000,
      paymentMethod: 'momo',
      paymentStatus: 'paid',
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      driverId: 'driver-1',
      driverName: 'Nguyễn Văn Hùng',
      etaMinutes: 0
    },
    {
      id: 'DH-1002',
      customerName: 'Phạm Ngọc Thạch',
      phone: '0935555123',
      address: 'K45/12 Nguyễn Chí Thanh, Hải Châu, Đà Nẵng',
      items: [
        { productName: 'Bánh Canh Cá Lóc Hấp Truyền Thống', quantity: 1, price: 45000, noodleType: 'Bột lọc' },
        { productName: 'Trứng Cút (5 Quả)', quantity: 1, price: 8000 }
      ],
      totalAmount: 53000,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'preparing',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    }
  ];

  const users = [
    { id: '1', username: 'admin', email: 'admin@banhcanhcaloc.com', password: 'admin', role: 'admin', name: 'Chủ Quán' },
    { id: '2', username: 'khachhang', email: 'khachhang@gmail.com', password: 'password', role: 'customer', name: 'Nguyễn Văn Minh' }
  ];

  // API - Auth
  app.post("/api/auth/register", (req, res) => {
    const { username, email, password, role, name, phone, address } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
    }
    const exists = users.find(u => u.username === username || u.email === email);
    if (exists) {
      return res.status(400).json({ error: "Tên đăng nhập hoặc Email đã tồn tại" });
    }
    const newUser = {
      id: String(users.length + 1),
      username,
      email,
      password,
      role: role || 'customer',
      name: name || username,
      phone,
      address
    };
    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // API - Products
  app.get("/api/products", (req, res) => {
    res.json(products);
  });

  // API - Drivers
  app.get("/api/drivers", (req, res) => {
    res.json(drivers);
  });

  app.post("/api/drivers", (req, res) => {
    const { name, phone, vehicle } = req.body;
    if (!name || !phone || !vehicle) {
      return res.status(400).json({ error: "Thông tin tài xế không đầy đủ" });
    }
    const newDriver: Driver = {
      id: 'driver-' + (drivers.length + 1),
      name,
      phone,
      vehicle,
      status: 'available',
      rating: 5.0,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'
    };
    drivers.push(newDriver);
    res.status(201).json(newDriver);
  });

  app.put("/api/drivers/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: "Không tìm thấy tài xế" });
    }
    driver.status = status;
    res.json(driver);
  });

  // API - Orders
  app.get("/api/orders", (req, res) => {
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const { customerName, phone, address, items, totalAmount, paymentMethod } = req.body;
    if (!customerName || !phone || !address || !items || !items.length) {
      return res.status(400).json({ error: "Thông tin đặt hàng không hợp lệ" });
    }

    const oId = 'DH-' + (1000 + orders.length + 1);
    const newOrder: Order = {
      id: oId,
      customerName,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder); // Add to beginning
    res.status(201).json(newOrder);
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: "Không thấy đơn hàng" });
    }
    order.status = status;
    if (status === 'completed') {
      order.paymentStatus = 'paid';
      if (order.driverId) {
        const dr = drivers.find(d => d.id === order.driverId);
        if (dr) dr.status = 'available';
      }
    }
    res.json(order);
  });

  app.put("/api/orders/:id/assign-driver", (req, res) => {
    const { id } = req.params;
    const { driverId } = req.body;
    const order = orders.find(o => o.id === id);
    const driver = drivers.find(d => d.id === driverId);

    if (!order) {
      return res.status(404).json({ error: "Không thấy đơn hàng" });
    }
    if (!driver) {
      return res.status(404).json({ error: "Không thấy tài xế" });
    }

    // Unassign previous driver if any
    if (order.driverId) {
      const oldDr = drivers.find(d => d.id === order.driverId);
      if (oldDr) oldDr.status = 'available';
    }

    order.driverId = driver.id;
    order.driverName = driver.name;
    order.status = 'shipping';
    order.etaMinutes = 15;
    driver.status = 'busy';

    res.json(order);
  });

  // Aggregated Stats
  app.get("/api/stats", (req, res) => {
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const driverUtilization = drivers.filter(d => d.status === 'busy').length;

    // Dishes rank calculator helper
    const dishCounts: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(it => {
        dishCounts[it.productName] = (dishCounts[it.productName] || 0) + it.quantity;
      });
    });

    const topDishes = Object.entries(dishCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    res.json({
      totalRevenue,
      activeOrders,
      completedOrders,
      totalDrivers: drivers.length,
      driverUtilization,
      topDishes
    });
  });

  // Vite static/asset rendering or routing fallback logic
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
