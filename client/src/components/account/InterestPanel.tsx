import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Panel, EmptyState, dateLabel } from "./AccountPanels";
export default function InterestPanel() {
  const query = trpc.interest.mine.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const leave = trpc.interest.leave.useMutation({
    onSuccess: () => {
      void utils.interest.mine.invalidate();
    },
  });
  return (
    <Panel
      id="account-interests"
      title="Your saved interests"
      eyebrow="04 / INTEREST, NOT A RESERVATION"
    >
      {query.isError ? (
        <div role="alert" className="p-6 text-sm md:p-8">
          <p>
            Saved interests are unavailable. This does not mean your list is
            empty.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              void query.refetch();
            }}
            disabled={query.isFetching}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : query.isLoading ? (
        <p role="status" className="p-6 text-sm md:p-8">
          Loading your saved interests…
        </p>
      ) : query.data?.length ? (
        <ul className="divide-y divide-border">
          {query.data.map(item => (
            <li
              key={item.productId}
              className="flex flex-wrap items-center justify-between gap-4 p-6 md:px-8"
            >
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Saved {dateLabel(item.createdAt)}
                </p>
              </div>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={leave.isPending}
                onClick={() => leave.mutate({ productId: item.productId })}
              >
                {leave.isPending &&
                leave.variables?.productId === item.productId
                  ? "Removing…"
                  : "Remove interest"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No saved interests.">
          Save interest from the shop without placing an order.
        </EmptyState>
      )}
      {leave.isError && (
        <p role="alert" className="px-6 pb-5 text-sm text-destructive">
          Removal could not be confirmed: {leave.error.message}
        </p>
      )}
      <p className="border-t border-border px-6 py-5 text-xs leading-relaxed text-muted-foreground md:px-8">
        This account preference stores a product identifier and consent record.
        It is not a stock reservation or approval. You can withdraw it here. No
        automated emails are enabled.
      </p>
    </Panel>
  );
}
