import { Link } from "wouter";
import { ArrowLeft, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card p-8 rounded-xl border border-border shadow-sm text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Map className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-3 tracking-tight">Protocol Not Found</h1>
        <p className="text-foreground/70 mb-8 leading-relaxed">
          The reference page you're looking for isn't in this field manual. Let's get back to the structured system.
        </p>
        
        <Link href="/">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Return to Blueprint
          </Button>
        </Link>
      </div>
    </div>
  );
}