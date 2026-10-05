export function serializeCategory(category) {
  return {
    id: category.id,

    name: category.name,

    slug: category.slug,

    description: category.description || null,

    status: category.status,

    sortOrder: category.sortOrder,

    createdAt: category.createdAt,

    updatedAt: category.updatedAt,
  };
}

export function serializeProduct(product) {
  const category = product.categoryId;

  return {
    id: product.id,

    name: product.name,

    slug: product.slug,

    shortDescription: product.shortDescription || null,

    status: product.status,

    publicVisible: product.publicVisible,

    sortOrder: product.sortOrder,

    category:
      category && typeof category === "object" && category.name
        ? {
            id: category.id,

            name: category.name,

            slug: category.slug,

            status: category.status,
          }
        : {
            id: String(product.categoryId),
          },

    createdAt: product.createdAt,

    updatedAt: product.updatedAt,
  };
}
