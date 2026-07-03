import { prisma } from "@/src/lib/prisma";
import { AppError } from "@/src/lib/errors";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/src/lib/schemas/category.schema";
import { Prisma } from "@prisma/client";

export async function listCategories() {
  return prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findFirst({
    where: { id, deletedAt: null },
  });

  if (!category) {
    throw new AppError("CATEGORY_NOT_FOUND", "Category not found.", 404);
  }

  return category;
}

export async function createCategory(data: CreateCategoryInput) {
  try {
    return await prisma.category.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError("CATEGORY_ALREADY_EXISTS", "A category with this name already exists.", 409);
    }
    throw err;
  }
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  await getCategoryById(id); // throws if not found

  try {
    return await prisma.category.update({ where: { id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError("CATEGORY_ALREADY_EXISTS", "A category with this name already exists.", 409);
    }
    throw err;
  }
}

export async function softDeleteCategory(id: string) {
  await getCategoryById(id); // throws if not found

  await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
