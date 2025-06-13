import { Badge } from "@/components/ui/badge"
import { IconCircleCheckFilled,  IconCircleX,  IconHourglassHigh } from "@tabler/icons-react"

export function StatusRoomBadge({ nextAvailableDate }: { nextAvailableDate: string | null }) {
  const StatusMap = {
    'occupied': "Occupied",
    'coming_soon': "Coming Soon", 
    'available': "Available",
  }

  const IconMapping = {
    'occupied': IconCircleX,
    'coming_soon': IconHourglassHigh,
    'available': IconCircleCheckFilled,
  }

  const getRoomStatus = (date: string | null) => {
    if (!date) return 'available'
    
    const nextDate = new Date(date)
    const twoMonthsFromNow = new Date()
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)
    
    if (nextDate > twoMonthsFromNow) {
      return 'occupied'
    }
    
    return 'coming_soon'
  }

  const status = getRoomStatus(nextAvailableDate)
  const Icon = IconMapping[status as keyof typeof IconMapping]

  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5">
      {Icon && <Icon className={status === 'coming_soon' ? "" : status === 'available' ? "" : ""} />}
      {StatusMap[status as keyof typeof StatusMap]}
    </Badge>
  )
}