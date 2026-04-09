import { getMenuItems, getMenuCategories } from '@/lib/cafe-db'
import MenuClient from './menu-client'

export default async function ManageMenuPage() {
    const [items, categories] = await Promise.all([
        getMenuItems(),
        getMenuCategories()
    ])

    return <MenuClient initialItems={items} initialCategories={categories} />
}
