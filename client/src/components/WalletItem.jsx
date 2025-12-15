import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  CardAction 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const WalletItem = ({
  event_name,
  outcome_name,
  shares_held,
  current_yes_price,
  position,
  event_status,
  updated_at,
  outcome_id,
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight line-clamp-1" title={event_name}>
            {event_name}
          </CardTitle>
          <CardDescription className="text-base font-medium text-primary">
            {outcome_name}
          </CardDescription>
        </div>
        <CardAction>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(event_status)} uppercase tracking-wider`}>
            {event_status}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</p>
            <p className="text-2xl font-bold tracking-tight">{position}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shares</p>
            <p className="text-2xl font-bold tracking-tight">{shares_held}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</p>
            <p className="text-2xl font-bold tracking-tight">
              ${Number(current_yes_price || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between bg-muted/30 py-4 mt-2">
        <p className="text-xs text-muted-foreground font-medium">
          Last updated {new Date(updated_at).toLocaleDateString()}
        </p>
        <Button 
          variant="default" 
          size="sm"
          className="font-semibold px-6"
          onClick={() => navigate(`/events/sellshares/${outcome_id}/${position}`)}
        >
          Sell Shares
        </Button>
      </CardFooter>
    </Card>
  );
};
