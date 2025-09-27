import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { SearchResult } from "@/lib/search";
import { FileText, Download } from "lucide-react";

interface ResourceCardProps {
  result: SearchResult;
}

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const ResourceCard = ({ result }: ResourceCardProps) => {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            {/* Internal app navigation */}
            <Link to={`/resource/${result.source_id}`}>
              <h3 className="font-semibold hover:text-primary">{result.title}</h3>
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
              {result.metadata?.is_locked && (
                <Badge variant="destructive" className="text-xs">
                  Premium
                </Badge>
              )}
            </div>

            {result.metadata?.resource_url && (
              isExternalUrl(result.metadata.resource_url) ? (
                <a
                  href={result.metadata.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                >
                  <Download className="h-3 w-3" />
                  Download resource
                </a>
              ) : (
                <Link
                  to={result.metadata.resource_url}
                  className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                >
                  <Download className="h-3 w-3" />
                  Open resource
                </Link>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
