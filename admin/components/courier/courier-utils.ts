export interface Courier {
    id: string
    full_name?: string
    email: string
    phone?: string
    role: string
}

export interface CourierSession extends Courier {
    loggedInAt: string
}

export function openIn2GIS(lat?: number, lng?: number, address?: string) {
    if (lat && lng) {
        window.open(`https://2gis.kz/geo/${lng},${lat}`, '_blank')
    } else if (address) {
        window.open(`https://2gis.kz/search/${encodeURIComponent(address)}`, '_blank')
    }
}

export function openIn2GISRoute(lat?: number, lng?: number, address?: string) {
    if (lat && lng) {
        window.open(`https://2gis.kz/routeSearch/rsType/car/to/${lng},${lat}`, '_blank')
    } else if (address) {
        window.open(`https://2gis.kz/search/${encodeURIComponent(address)}`, '_blank')
    }
}
