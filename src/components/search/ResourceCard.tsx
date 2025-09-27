import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { SearchResult } from "@/lib/search";
import { FileText, Download, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useToast } from "@/components/ui/use-toast";

interface ResourceCardProps {
  result: SearchResult;
}

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const ResourceCard = ({ result }: ResourceCardProps) => {
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();

  const hasDownloadAccess = () => {
    if (!result.metadata?.is_locked) return true;
    
    if (!user) return false;
    
    const resourceAccessLevel = result.metadata?.access_level || 'free';
    
    switch (resourceAccessLevel) {
      case 'free':
        return true;
      case 'auth':
        return !!user;
      case 'basic':
        return subscription?.tier === 'basic' || subscription?.tier === 'premium' || subscription?.tier === 'professional';
      case 'premium':
        return subscription?.tier === 'premium' || subscription?.tier === 'professional';
      case 'professional':
        return subscription?.tier === 'professional';
      default:
        return false;
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    if (!hasDownloadAccess()) {
      e.preventDefault();
      e.stopPropagation();
      
      toast({
        title: "Upgrade Required",
        description: "This resource requires a subscription. Upgrade to access premium content.",
        variant: "destructive",
      });
      
      return false;
    }
    return true;
  };

  const handleLockedResourceClick = (e: React.MouseEvent) => {
    if (!hasDownloadAccess()) {
      e.preventDefault();
      e.stopPropagation();
      
      toast({
        title: "Premium Resource",
        description: "Subscribe to unlock this premium resource and many more.",
        variant: "default",
      });
    }
  };

  const getAccessBadge = () => {
    if (!result.metadata?.is_locked) return null;
    
    const accessLevel = result.metadata?.access_level || 'premium';
    const badgeVariant = accessLevel === 'professional' ? 'destructive' : 
                        accessLevel === 'premium' ? 'default' : 'secondary';
    
    return (
      <Badge variant={badgeVariant} className="text-xs capitalize">
        {accessLevel}
      </Badge>
    );
  };

  const renderDownloadButton = () => {
    const hasAccess = hasDownloadAccess();
    const isLocked = result.metadata?.is_locked && !hasAccess;
    
    if (isExternalUrl(result.metadata.resource_url)) {
      return (
        <a
          href={hasAccess ? result.metadata.resource_url : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs mt-2 hover:underline ${
            hasAccess ? 'text-primary' : 'text-muted-foreground cursor-not-allowed'
          }`}
          onClick={handleDownloadClick}
        >
          {isLocked ? <Lock className="h-3 w-3" /> : <Download className="h-3 w-3" />}
          {isLocked ? 'Subscribe to download' : 'Download resource'}
        </a>
      );
    } else {
      return (
        <Link
          to={hasAccess ? result.metadata.resource_url : '#'}
          className={`inline-flex items-center gap-1 text-xs mt-2 hover:underline ${
            hasAccess ? 'text-primary' : 'text-muted-foreground cursor-not-allowed'
          }`}
          onClick={isLocked ? handleLockedResourceClick : undefined}
        >
          {isLocked ? <Lock className="h-3 w-3" /> : <Download className="h-3 w-3" />}
          {isLocked ? 'Subscribe to access' : 'Open resource'}
        </Link>
      );
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            result.metadata?.is_locked && !hasDownloadAccess() 
              ? 'bg-muted' 
              : 'bg-primary/10'
          }`}>
            <FileText className={`h-6 w-6 ${
              result.metadata?.is_locked && !hasDownloadAccess() 
                ? 'text-muted-foreground' 
                : 'text-primary'
            }`} />
          </div>
          <div className="flex-1">
            <Link 
              to={`/resource/${result.source_id}`}
              onClick={result.metadata?.is_locked && !hasDownloadAccess() ? handleLockedResourceClick : undefined}
            >
              <h3 className={`font-semibold hover:text-primary ${
                result.metadata?.is_locked && !hasDownloadAccess() ? 'text-muted-foreground' : ''
              }`}>
                {result.title}
                {result.metadata?.is_locked && !hasDownloadAccess() && (
                  <Lock className="h-3 w-3 inline-block ml-1" />
                )}
              </h3>
            </Link>

            <p
              className="text-sm text-muted-foreground mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />

            <div className="flex flex-wrap gap-1 mt-2">
              {result.metadata?.level && (
                <Badge variant="secondary" className="text-xs">
                  {result.metadata.level}
                </Badge>
              )}
              {result.metadata?.duration && (
                <Badge variant="outline" className="text-xs">
                  {result.metadata.duration}
                </Badge>
              )}
              {getAccessBadge()}
            </div>

            {result.metadata?.resource_url && renderDownloadButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
