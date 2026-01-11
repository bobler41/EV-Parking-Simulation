import type { InputSet } from "../types";

type Props = {
  items: InputSet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function InputSetList(props: Props) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="text-lg font-semibold text-gray-900">Input sets</div>

      {props.items.length === 0 && (
        <div className="mt-3 text-sm text-gray-600">No input sets yet.</div>
      )}

      <div className="mt-3 space-y-2">
        {props.items.map(item => {
          const selected = item.id === props.selectedId;
          return (
            <button
              key={item.id}
              className={[
                "w-full text-left rounded border px-3 py-2",
                selected ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white"
              ].join(" ")}
              onClick={() => props.onSelect(item.id)}
            >
              <div className="font-semibold text-gray-900">
                {item.name ?? "Untitled"}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {item.chargePoints} CP, {item.chargerPowerKw} kW, multiplier{" "}
                {(item.arrivalMultiplier * 100).toFixed(0)} percent
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
