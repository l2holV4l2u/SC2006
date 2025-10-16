import { Crown } from "lucide-react";
import { AlertDialogHeader } from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Dispatch } from "react";
import { SetStateAction } from "jotai";
import { useRouter } from "next/navigation";

export function PremiumFeatureDialog({
  openPremiumDialog,
  setOpenPremiumDialog,
}: {
  openPremiumDialog: boolean;
  setOpenPremiumDialog: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  return (
    <Dialog open={openPremiumDialog} onOpenChange={setOpenPremiumDialog}>
      <DialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-amber-500" />
            <DialogTitle>Premium Feature</DialogTitle>
          </div>
          <DialogDescription>
            Map view is available exclusively for premium members.
          </DialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Unlock Map View:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                <span>Interactive map with all property locations</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                <span>Visualize property distribution by area</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                <span>Cluster view for better neighborhood insights</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                <span>Click markers to view property details</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpenPremiumDialog(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => router.push("/subscription")}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Crown size={16} />
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
