import type { Ad } from "@/types/ad"

export type AdFolderNode = {
  id: string
  name: string
  company?: string
  product?: string
  children?: AdFolderNode[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function buildAdFolderTree(ads: Ad[]): AdFolderNode[] {
  const companies = new Map<string, Set<string>>()

  for (const ad of ads) {
    if (!ad.company) continue
    if (!companies.has(ad.company)) {
      companies.set(ad.company, new Set())
    }
    if (ad.product) {
      companies.get(ad.company)!.add(ad.product)
    }
  }

  return Array.from(companies.entries()).map(([company, products]) => ({
    id: slugify(company),
    name: company,
    company,
    children: Array.from(products).map((product) => ({
      id: `${slugify(company)}__${slugify(product)}`,
      name: product,
      company,
      product,
    })),
  }))
}

export function filterAdsByFolder(ads: Ad[], folderId: string | null): Ad[] {
  if (!folderId) return ads

  return ads.filter((ad) => {
    const companyId = slugify(ad.company)
    const productId = `${companyId}__${slugify(ad.product)}`
    return folderId === companyId || folderId === productId
  })
}

export function filterAdsByQuery(ads: Ad[], query: string): Ad[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return ads

  return ads.filter(
    (ad) =>
      ad.title.toLowerCase().includes(normalized) ||
      ad.company.toLowerCase().includes(normalized) ||
      ad.product.toLowerCase().includes(normalized)
  )
}

export function getFolderDefaults(
  activeFolderId: string | null,
  folders: AdFolderNode[]
): { company: string; product: string } {
  if (!activeFolderId) return { company: "", product: "" }

  for (const companyNode of folders) {
    if (companyNode.id === activeFolderId) {
      return { company: companyNode.name, product: "" }
    }
    for (const productNode of companyNode.children ?? []) {
      if (productNode.id === activeFolderId) {
        return { company: companyNode.name, product: productNode.name }
      }
    }
  }

  return { company: "", product: "" }
}
