import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"

export const EventOverviewCard = ({event}) => {
    const navigate = useNavigate()

    const dateOptions = {
        year: "2-digit",
        month: "short",
        day: "numeric",
      };

    const formatPrice = (price) => {
        const cents = Math.round(Number(price) * 100);
        return `${cents}c`;
    };

    const handleBuyClick = (e, outcomeId, yesNo) => {
        e.stopPropagation();
        navigate(`/events/buyshares/${outcomeId}/${yesNo}`);
    };

    return (
        <Card 
            key={event.event_id} 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer min-w-fit flex flex-col justify-between gap-4"
            onClick={() => navigate(`/events/${event.event_id}`)}
        >

        <div>
            <h3 className="font-semibold text-lg line-clamp-2">{event.name}</h3>
        </div>
        
        <div className="space-y-3">
            {event.outcomes?.slice(0, 2).map((outcome) => (
                <div key={outcome.outcome_id} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-muted-foreground flex-1 min-w-0 break-words pr-2">{outcome.name}</span>
                    <div className="flex gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 min-w-12 px-2 text-xs group bg-green-600 dark:bg-green-600 dark:hover:bg-green-600/80 hover:bg-green-600/80"
                            onClick={(e) => handleBuyClick(e, outcome.outcome_id, 'YES')}
                        >
                            <span className="group-hover:hidden">Yes</span>
                            <span className="hidden group-hover:inline">{formatPrice(outcome.current_yes_price)}</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 min-w-12 px-2 text-xs group bg-red-600 dark:bg-red-600 dark:hover:bg-red-600/80 hover:bg-red-600/80"
                            onClick={(e) => handleBuyClick(e, outcome.outcome_id, 'NO')}
                        >
                            <span className="group-hover:hidden">No</span>
                            <span className="hidden group-hover:inline">{formatPrice(outcome.current_no_price)}</span>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="flex items-center gap-2 pt-2 justify-self-end">
            {event.status === 'active' ? 
                <div className=
                    "size-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_2px_rgba(34,197,94,0.7)]">
                </div> 
            : event.status === 'completed' ? 
                <div className=
                    "size-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_2px_rgba(220,38,38,0.7)]">
                </div>  
            : event.status === 'upcoming' ? 
                <div className=
                    "size-3 rounded-full bg-blue-700 animate-pulse shadow-[0_0_8px_2px_rgba(29,78,216,0.7)]">
                </div>   
            :
                <div className=
                    "size-3 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_2px_rgba(253,224,71,0.7)]">
                </div>   }
        
        <p className="text-sm text-muted-foreground">
            {new Date(event.start_time).toLocaleDateString(undefined, dateOptions)} to {new Date(event.end_time).toLocaleDateString(undefined, dateOptions)}
        </p>

        </div>
        </Card>
    )
}