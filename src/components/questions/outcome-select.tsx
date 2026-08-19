"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OutcomeSelectList } from "./outcome-select-list";
import { buildCurriculumTree, findPathToSubOutcome, type OutcomeSelectProps } from "./outcome-select.types";

function matchesSearch(text: string, query: string) {
  return text.toLocaleLowerCase("tr").includes(query);
}

export function OutcomeSelect({
  data,
  value,
  onChange,
  gradeLevel,
  isLoading,
  error,
  disabled,
}: OutcomeSelectProps) {
  const [searchText, setSearchText] = useState("");
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [expandedOutcomeId, setExpandedOutcomeId] = useState<string | null>(null);

  const tree = useMemo(() => buildCurriculumTree(data, gradeLevel), [data, gradeLevel]);
  const query = searchText.trim().toLocaleLowerCase("tr");
  const isSearching = query.length > 0;

  const { filteredTree, matchedUnitIds, matchedTopicIds, matchedOutcomeIds } = useMemo(() => {
    if (!isSearching) {
      return { filteredTree: tree, matchedUnitIds: new Set<string>(), matchedTopicIds: new Set<string>(), matchedOutcomeIds: new Set<string>() };
    }
    const units = tree
      .map((unit) => ({
        ...unit,
        topics: unit.topics
          .map((topic) => ({
            ...topic,
            outcomes: topic.outcomes
              .map((outcome) => ({
                ...outcome,
                subOutcomes: outcome.subOutcomes.filter((s) => matchesSearch(s.title, query)),
              }))
              .filter((outcome) => matchesSearch(outcome.title, query) || outcome.subOutcomes.length > 0),
          }))
          .filter((topic) => topic.outcomes.length > 0),
      }))
      .filter((unit) => unit.topics.length > 0);

    const unitIds = new Set<string>();
    const topicIds = new Set<string>();
    const outcomeIds = new Set<string>();
    units.forEach((unit) => {
      unitIds.add(unit.id);
      unit.topics.forEach((topic) => {
        topicIds.add(topic.id);
        topic.outcomes.forEach((outcome) => outcomeIds.add(outcome.id));
      });
    });
    return { filteredTree: units, matchedUnitIds: unitIds, matchedTopicIds: topicIds, matchedOutcomeIds: outcomeIds };
  }, [tree, isSearching, query]);

  const selectedPath = useMemo(() => findPathToSubOutcome(data, value), [data, value]);

  function toggleUnit(id: string) {
    setExpandedUnitId((prev) => (prev === id ? null : id));
  }
  function toggleTopic(id: string) {
    setExpandedTopicId((prev) => (prev === id ? null : id));
  }
  function toggleOutcome(id: string) {
    setExpandedOutcomeId((prev) => (prev === id ? null : id));
  }

  const expandedUnitIds = isSearching ? matchedUnitIds : new Set(expandedUnitId ? [expandedUnitId] : []);
  const expandedTopicIds = isSearching ? matchedTopicIds : new Set(expandedTopicId ? [expandedTopicId] : []);
  const expandedOutcomeIds = isSearching ? matchedOutcomeIds : new Set(expandedOutcomeId ? [expandedOutcomeId] : []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alt kazanım seç</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Kazanım ara"
            placeholder="Kazanım ara…"
            className="pl-9"
            value={searchText}
            disabled={disabled || isLoading}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        {selectedPath && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge className="border-primary/20 bg-primary/10 text-primary">{selectedPath.unit.title}</Badge>
            <span className="text-xs text-muted-foreground">›</span>
            <Badge className="border-primary/20 bg-primary/10 text-primary">{selectedPath.outcome.title}</Badge>
            <span className="text-xs text-muted-foreground">›</span>
            <Badge className="border-primary/20 bg-primary/10 text-primary">{selectedPath.subOutcome.title}</Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Seçimi temizle"
              className="size-6"
              onClick={() => onChange(null)}
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("max-h-80 overflow-y-auto", disabled && "pointer-events-none opacity-50")}>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : filteredTree.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isSearching ? `"${searchText}" ile eşleşen kazanım bulunamadı.` : "Kayıtlı müfredat bulunamadı."}
          </p>
        ) : (
          <OutcomeSelectList
            units={filteredTree}
            value={value}
            onSelect={(subOutcomeId) => onChange(subOutcomeId)}
            expandedUnitIds={expandedUnitIds}
            expandedTopicIds={expandedTopicIds}
            expandedOutcomeIds={expandedOutcomeIds}
            onToggleUnit={toggleUnit}
            onToggleTopic={toggleTopic}
            onToggleOutcome={toggleOutcome}
          />
        )}
      </CardContent>
    </Card>
  );
}
