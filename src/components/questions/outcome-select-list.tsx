"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnitNode } from "./outcome-select.types";

type OutcomeSelectListProps = {
  units: UnitNode[];
  value: string | null;
  onSelect: (subOutcomeId: string) => void;
  expandedUnitIds: ReadonlySet<string>;
  expandedTopicIds: ReadonlySet<string>;
  expandedOutcomeIds: ReadonlySet<string>;
  onToggleUnit: (id: string) => void;
  onToggleTopic: (id: string) => void;
  onToggleOutcome: (id: string) => void;
};

function Disclosure({
  id,
  title,
  depth,
  isExpanded,
  onToggle,
  emphasize,
}: {
  id: string;
  title: string;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  emphasize?: boolean;
}) {
  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      aria-controls={`outcome-node-${id}`}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg py-2 pr-2 text-left hover:bg-muted",
        emphasize ? "text-sm font-medium" : "text-sm",
        depth === 1 && "pl-2",
        depth === 2 && "pl-6",
        depth === 3 && "pl-10"
      )}
    >
      {isExpanded ? (
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      ) : (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <span>{title}</span>
    </button>
  );
}

export function OutcomeSelectList({
  units,
  value,
  onSelect,
  expandedUnitIds,
  expandedTopicIds,
  expandedOutcomeIds,
  onToggleUnit,
  onToggleTopic,
  onToggleOutcome,
}: OutcomeSelectListProps) {
  return (
    <div className="flex flex-col">
      {units.map((unit) => {
        const isUnitExpanded = expandedUnitIds.has(unit.id);
        return (
          <div key={unit.id}>
            <Disclosure
              id={unit.id}
              title={unit.title}
              depth={1}
              isExpanded={isUnitExpanded}
              onToggle={() => onToggleUnit(unit.id)}
              emphasize
            />
            {isUnitExpanded && (
              <div id={`outcome-node-${unit.id}`}>
                {unit.topics.map((topic) => {
                  const isTopicExpanded = expandedTopicIds.has(topic.id);
                  return (
                    <div key={topic.id}>
                      <Disclosure
                        id={topic.id}
                        title={topic.title}
                        depth={2}
                        isExpanded={isTopicExpanded}
                        onToggle={() => onToggleTopic(topic.id)}
                      />
                      {isTopicExpanded && (
                        <div id={`outcome-node-${topic.id}`}>
                          {topic.outcomes.map((outcome) => {
                            const isOutcomeExpanded = expandedOutcomeIds.has(outcome.id);
                            return (
                              <div key={outcome.id}>
                                <Disclosure
                                  id={outcome.id}
                                  title={outcome.title}
                                  depth={3}
                                  isExpanded={isOutcomeExpanded}
                                  onToggle={() => onToggleOutcome(outcome.id)}
                                />
                                {isOutcomeExpanded && (
                                  <div id={`outcome-node-${outcome.id}`} className="flex flex-col">
                                    {outcome.subOutcomes.map((subOutcome) => {
                                      const isSelected = value === subOutcome.id;
                                      return (
                                        <button
                                          key={subOutcome.id}
                                          type="button"
                                          aria-pressed={isSelected}
                                          onClick={() => onSelect(subOutcome.id)}
                                          className={cn(
                                            "rounded-lg py-2 pl-14 pr-2 text-left text-sm hover:bg-muted",
                                            isSelected && "bg-primary/10 text-primary"
                                          )}
                                        >
                                          {subOutcome.title}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
