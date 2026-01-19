import { useState } from "react";
import { useCompanyInfo } from "@/hooks/use-audiometry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyInfoDialog() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useCompanyInfo();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Building2 className="h-4 w-4" />
          Company Info
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>QuickBooks Company Information</DialogTitle>
          <DialogDescription>
            Details of the connected QuickBooks company.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading company info...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              <p>Failed to load company info. Please ensure QuickBooks is connected.</p>
            </div>
          )}

          {data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {data.CompanyInfo?.CompanyName || 'Company Name'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Address:</strong>
                  <p className="text-sm text-muted-foreground">
                    {data.CompanyInfo?.CompanyAddr?.Line1 || 'N/A'}
                    {data.CompanyInfo?.CompanyAddr?.City && `, ${data.CompanyInfo.CompanyAddr.City}`}
                    {data.CompanyInfo?.CompanyAddr?.CountrySubDivisionCode && `, ${data.CompanyInfo.CompanyAddr.CountrySubDivisionCode}`}
                  </p>
                </div>
                <div>
                  <strong>Phone:</strong>
                  <p className="text-sm text-muted-foreground">
                    {data.CompanyInfo?.PrimaryPhone?.FreeFormNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <strong>Email:</strong>
                  <p className="text-sm text-muted-foreground">
                    {data.CompanyInfo?.Email?.Address || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}