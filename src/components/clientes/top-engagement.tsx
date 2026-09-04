import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

interface TopEngagedUser {
  userIdentifier: string;
  interactionCount: number;
  source: string;
}

export function TopEngagement({ users }: { users: TopEngagedUser[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Top engajamento</CardTitle></CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-ink-500">
            Esta fonte não fornece dado individual de usuários para este cliente — apenas métricas agregadas estão disponíveis.
          </p>
        ) : (
          <ol className="space-y-2 text-sm">
            {users.map((user, index) => (
              <li key={user.userIdentifier} className="flex items-center justify-between rounded-md bg-well px-3 py-2">
                <span className="font-medium text-ink-900">
                  <span className="mr-2 text-ink-400">#{index + 1}</span>
                  {user.userIdentifier}
                </span>
                <span className="text-ink-500">{formatNumber(user.interactionCount)} interações</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
