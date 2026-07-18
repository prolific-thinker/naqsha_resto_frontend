import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PhoneShell } from '@/components/layouts/PhoneShell';
import { BrandMark } from '@/components/naqsha/BrandMark';
import { SheetRef } from '@/components/naqsha/SheetRef';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useFeedbackContext, useSubmitFeedback } from '@/hooks/useFeedback';

const RATING_STEPS = [1, 2, 3, 4, 5];

export default function CustomerFeedback() {
  const { tableSlug = '' } = useParams();
  const { data: ctx, isLoading, isError } = useFeedbackContext(tableSlug);
  const submit = useSubmitFeedback();

  const [rating, setRating] = useState(4);
  const [liked, setLiked] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState('');

  function toggleDish(dish: string) {
    setLiked((prev) => (prev.includes(dish) ? prev.filter((d) => d !== dish) : [...prev, dish]));
  }

  if (isLoading) {
    return (
      <PhoneShell>
        <div className="grid flex-1 place-items-center font-mono text-xs uppercase tracking-code text-muted">
          Loading…
        </div>
      </PhoneShell>
    );
  }

  if (isError || !ctx) {
    return (
      <PhoneShell>
        <div className="grid flex-1 place-items-center text-center text-sm text-muted">
          This feedback link is no longer valid.
        </div>
      </PhoneShell>
    );
  }

  if (submit.isSuccess) {
    return (
      <PhoneShell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <CheckCircle2 size={44} className="text-success" strokeWidth={1.75} />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
            Shukriya!
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Your feedback reached {ctx.ownerFirstName} directly.
          </p>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="mb-5 flex items-center gap-2">
        <BrandMark size="sm" />
        <span className="font-display text-sm font-bold tracking-[-0.01em] text-ink">
          {ctx.branchLabel.replace('Naqsha ', '')}
        </span>
      </div>

      <div>
        <SheetRef tracking="ref" className="text-[10px]">
          Table {ctx.tableRef} · order {ctx.invoiceRef}
        </SheetRef>
        <h1 className="mt-1 font-display text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
          How was everything today?
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Takes about 30 seconds. Your feedback goes straight to {ctx.ownerFirstName}.
        </p>
      </div>

      <div className="py-6 text-center">
        <div className="mb-4 font-display text-[15px] font-medium text-ink">Rate your visit</div>
        <div className="flex justify-center gap-3">
          {RATING_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              aria-label={`${step} star${step > 1 ? 's' : ''}`}
              aria-pressed={rating >= step}
              onClick={() => setRating(step)}
              className={cn(
                'grid h-[38px] w-[38px] place-items-center rounded-md font-display text-xl font-bold transition-colors',
                rating >= step ? 'bg-saffron text-ink' : 'bg-paper-3 text-muted-2',
              )}
            >
              {step}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-between px-3 font-mono text-[10px] uppercase tracking-ref text-muted">
          <span>Bad</span>
          <span className="text-saffron">Great</span>
        </div>
      </div>

      <div className="mb-2.5 mt-2 font-mono text-[10px] uppercase tracking-code text-muted">
        What did you love?
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ctx.dishOptions.map((dish) => {
          const on = liked.includes(dish);
          return (
            <button
              key={dish}
              type="button"
              aria-pressed={on}
              onClick={() => toggleDish(dish)}
              className={cn(
                'rounded-[20px] border px-3 py-2 text-xs transition-colors',
                on
                  ? 'border-success bg-success text-paper'
                  : 'border-line bg-paper text-muted hover:border-line-strong',
              )}
            >
              {dish}
            </button>
          );
        })}
      </div>

      <div className="mb-2.5 mt-4 font-mono text-[10px] uppercase tracking-code text-muted">
        Anything to tell us?
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional — you can also skip"
        rows={3}
        className="rounded-md border-line"
      />

      <div className="mb-2.5 mt-4 font-mono text-[10px] uppercase tracking-code text-muted">
        Want us to remember you? (optional)
      </div>
      <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
        <span className="font-mono text-xs text-muted">+92</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          aria-label="Phone number"
          placeholder="300 1234567"
          className="flex-1 border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-muted-2"
        />
      </div>

      <div className="mt-auto pt-5">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={submit.isPending}
          onClick={() =>
            submit.mutate({
              tableSlug,
              rating,
              likedDishes: liked,
              comment: comment || undefined,
              phone: phone || undefined,
            })
          }
        >
          {submit.isPending ? 'Sending…' : 'Send feedback'}
        </Button>
        <div className="mt-3 text-center font-mono text-[10px] tracking-ref text-muted">
          Nothing shared with third parties · phone is used only to greet you next time
        </div>
      </div>
    </PhoneShell>
  );
}
