import { Router } from "express";
import { prisma } from "../db";
import { inputSetCreateSchema, inputSetUpdateSchema } from "../validation/inputSet";


const router = Router();

router.post("/", async (req, res) => {
  const parsed = inputSetCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error);
  }

  const created = await prisma.inputSet.create({
    data: parsed.data
  });

  return res.status(201).json(created);
});

router.get("/", async (_req, res) => {
  const items = await prisma.inputSet.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(items);
});

router.get("/:id", async (req, res) => {
  const item = await prisma.inputSet.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: "InputSet not found" });
  return res.json(item);
});

router.patch("/:id", async (req, res) => {
  const parsed = inputSetUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  try {
    const updated = await prisma.inputSet.update({
      where: { id: req.params.id },
      data: parsed.data
    });
    return res.json(updated);
  } catch {
    return res.status(404).json({ error: "InputSet not found" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.inputSet.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return res.status(404).json({ error: "InputSet not found" });
  }
});



export default router;
