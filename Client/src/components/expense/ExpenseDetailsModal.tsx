import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface User {
    id: string;
    fullName: string;
}

interface Expense {
    id: string;
    amount: number;
    description: string;
    type: string;
    payer: User;
    createdAt: string;
    splitDetails: Record<string, { amount: number; settled: boolean; percentage?: number }>;
}

interface ExpenseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: Expense | null;
    currentUser: User;
    members: User[];
    onSettle: (expenseId: string, debtorId: string) => void;
}

export function ExpenseDetailsModal({ isOpen, onClose, expense, currentUser, members, onSettle }: ExpenseDetailsModalProps) {
    if (!expense) return null;

    const getMemberName = (id: string) => {
        const member = members.find(m => m.id === id);
        return member ? member.fullName : "Unknown User";
    };

    const isPayer = expense.payer.id === currentUser.id;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Expense Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg">{expense.description}</h3>
                            <p className="text-sm text-muted-foreground">Paid by {expense.payer.fullName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(expense.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-xl text-primary">₹{expense.amount.toFixed(2)}</span>
                            <Badge variant="outline" className="ml-2 block w-fit ml-auto mt-1">{expense.type}</Badge>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Split Details</h4>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-3">
                                {Object.entries(expense.splitDetails || {}).map(([userId, details]) => (
                                    <div key={userId} className="flex items-center justify-between p-2 rounded-md bg-accent/50">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{getMemberName(userId)[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{getMemberName(userId)} {userId === currentUser.id && "(You)"}</p>
                                                {details.percentage && <p className="text-xs text-muted-foreground">{details.percentage}%</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">₹{details.amount.toFixed(2)}</span>
                                            {details.settled ? (
                                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                                    <Check size={12} className="mr-1" /> Settled
                                                </Badge>
                                            ) : (
                                                isPayer && userId !== currentUser.id ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => onSettle(expense.id, userId)}
                                                    >
                                                        Mark Settled
                                                    </Button>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600 border-yellow-500/50">Pending</Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
