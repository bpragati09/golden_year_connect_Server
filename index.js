import express from "express";
const app = express();
import { PrismaClient } from "./generated/prisma/client.js";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
import cors from "cors";
import jwt from "jsonwebtoken";

app.use(cors());


// Use env var in production
const SECRET_KEY = "8w0w0knyu892nsbbwbu";

app.use(express.json());

// Base route
app.get("/", (req, res) => {
  return res.send("Hello World!");
});

// User signup route
app.post("/user/signup", async (req, res) => {
  const { uuid, email, name, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      uuid,
      email,
      name,
      password: hashedPassword,
    },
  });

  if (user) {
    return res.status(201).json({
      message: "User created successfully",
    });
  } else {
    return res.status(400).json({
      message: "User creation failed",
    });
  }
});

// Event creation route
app.post("/events", async (req, res) => {
  const { title, description, eventDate, location } = req.body;

  try {
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        location,
      },
    });
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create event" });
  }
});

// Guardian signup route
app.post("/guardian/signup", async (req, res) => {
  const { uuid, email, name, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.guardian.create({
    data: {
      uuid,
      email,
      name,
      password: hashedPassword,
    },
  });

  if (user) {
    return res.status(201).json({
      message: "User created successfully",
    });
  } else {
    return res.status(400).json({
      message: "User creation failed",
    });
  }
});

// User login route
app.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({  email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// Guardian login route
app.post("/guardian/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.guardian.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ uuid: user.uuid, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        uuid: user.uuid,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// Get all events route
app.get("/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany();
    res.status(201).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create daily tip route
app.post("/tips", async (req, res) => {
  const { tipDate, content } = req.body;

  try {
    const newTip = await prisma.dailyTip.create({
      data: {
        tipDate: new Date(tipDate),
        content,
      },
    });

    res.status(201).json({
      message: "Daily tip created successfully",
      tip: newTip,
    });
  } catch (err) {
    console.error(err);
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Tip for this date already exists" });
    }
    res.status(500).json({ message: "Failed to create daily tip" });
  }
});

// Get all tips route
app.get("/tips", async (req, res) => {
  try {
    const tips = await prisma.dailyTip.findMany({
      orderBy: { tipDate: "desc" },
    });
    res.json(tips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tips" });
  }
});

// Create health record route
app.post("/health", async (req, res) => {
  const {
    userId,
    heartRate,
    bloodPressure,
    steps,
    sleepHours,
    notes,
    recordedAt,
  } = req.body;

  try {
    const newRecord = await prisma.health.create({
      data: {
        userId,
        heartRate,
        bloodPressure,
        steps,
        sleepHours,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : undefined,
      },
    });

    res.status(201).json({
      message: "Health record created successfully",
      health: newRecord,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create health record" });
  }
});

// Get user health records route
app.get("/health/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const records = await prisma.health.findFirst({
      where: { userId },
      orderBy: { recordedAt: "desc" },
    });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch health records" });
  }
});

// Join event route
app.post("/event/:eventId/join", async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.body;

  try {
    const participant = await prisma.eventParticipant.create({
      data: {
        eventId,
        userId,
      },
    });

    res.status(201).json({
      message: "User joined the event",
      participant,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ message: "User already joined this event" });
    }
    console.error(err);
    res.status(500).json({ message: "Could not join event" });
  }
});

// Get user events route
app.get("/user/:userId/events", async (req, res) => {
  const { userId } = req.params;

  try {
    const events = await prisma.eventParticipant.findMany({
      where: { userId },
      include: {
        event: true,
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch user events" });
  }
});

// Assign guardian to user route
app.post("/guardian/:guardianId/assign", async (req, res) => {
  const { guardianId } = req.params;
  const { userId } = req.body;

  try {
    const relation = await prisma.guardianUser.create({
      data: {
        guardianId,
        userId,
      },
    });

    res.status(201).json({
      message: "Guardian assigned to user successfully",
      relation,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ message: "Guardian already assigned to user" });
    }
    console.error(err);
    res.status(500).json({ message: "Failed to assign guardian" });
  }
});

// Get guardian's users route
app.get("/guardian/:guardianId/users", async (req, res) => {
  const { guardianId } = req.params;

  try {
    const users = await prisma.guardianUser.findMany({
      where: { guardianId },
      include: { user: true },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch users for guardian" });
  }
});

// Get user's guardians route
app.get('/user/:userId/guardians', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const guardians = await prisma.guardianUser.findMany({
        where: { userId },
        include: { guardian: true },
      });
  
      res.json(guardians);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch guardians for user' });
    }
  });


  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running...');
  });