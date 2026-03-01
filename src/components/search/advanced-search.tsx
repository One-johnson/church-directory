"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Clock, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getCountryFlagClass,
  getCountryByCode,
  getCountryOptions,
} from "@/data/countries";
import type { Id } from "../../../convex/_generated/dataModel";
import { getCategories } from "../../data/catetories";

interface AdvancedSearchProps {
  onResults?: (results: any[]) => void;
  allProfiles?: any[] | null;
  onSearchActiveChange?: (active: boolean) => void;
}

export function AdvancedSearch({ onResults, allProfiles, onSearchActiveChange }: AdvancedSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [branch, setBranch] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const hasActiveSearch =
    debouncedQuery.trim().length >= 2 ||
    (category !== "" && category !== "All") ||
    (branch !== "") ||
    (country !== "") ||
    verifiedOnly;

  const searchResults = useQuery(
    api.search.searchProfiles,
    hasActiveSearch
      ? {
          query: debouncedQuery.trim().length >= 2 ? debouncedQuery.trim() : undefined,
          category: category && category !== "All" ? category : undefined,
          branch: branch.trim() || undefined,
          country: country.trim() || undefined,
          verifiedOnly: verifiedOnly || undefined,
        }
      : "skip"
  );

  const allCountries = useQuery(api.search.getAllCountries);

  const suggestions = useQuery(
    api.search.getSearchSuggestions,
    query.length >= 2 ? { query } : "skip"
  );

  const searchHistory = useQuery(
    api.search.getSearchHistory,
    user ? { userId: user._id as Id<"users">, limit: 5 } : "skip"
  );

  const allBranches = useQuery(api.search.getAllBranches);

  const saveSearch = useMutation(api.search.saveSearchHistory);
  const clearHistory = useMutation(api.search.clearSearchHistory);

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.length >= 2 && user) {
        saveSearch({
          userId: user._id as Id<"users">,
          query,
          filters: { category, branch, country },
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, category, location, branch, country, user, saveSearch]);

  // Notify parent when search/filters become active or inactive
  useEffect(() => {
    onSearchActiveChange?.(hasActiveSearch);
  }, [hasActiveSearch, onSearchActiveChange]);

  // Send results to parent: full list when no active search, filtered results when searching
  useEffect(() => {
    if (!onResults) return;
    if (!hasActiveSearch) {
      onResults(allProfiles ?? []);
    } else if (searchResults !== undefined) {
      onResults(searchResults);
    }
  }, [hasActiveSearch, searchResults, allProfiles, onResults]);

  const handleClearFilters = () => {
    setCategory("All");
    setBranch("");
    setCountry("");
    setVerifiedOnly(false);
  };

  const handleClearHistory = async () => {
    if (user) {
      await clearHistory({ userId: user._id as Id<"users"> });
    }
  };

  const activeFiltersCount = [
    category && category !== "All" ? category : null,
    branch ? branch : null,
    country ? country : null,
    verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search professionals, skills, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            className="pl-9"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Recent Searches */}
          {showHistory && searchHistory && searchHistory.length > 0 && (
            <Card className="absolute top-full mt-2 w-full z-50">
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-6 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((item) => (
                    <button
                      key={item._id}
                      className="w-full text-left text-sm p-2 hover:bg-accent rounded-md"
                      onClick={() => setQuery(item.query)}
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && query.length >= 2 && !showHistory && (
            <Card className="absolute top-full mt-2 w-full z-50">
              <CardContent className="p-2">
                <div className="text-sm font-medium mb-2">Suggestions</div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full text-left text-sm p-2 hover:bg-accent rounded-md"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filter Button */}
        <Button variant="outline" size="icon" className="relative">
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Category Select */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {getCategories().map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Branch Select - user's church branch */}
        <SearchableSelect
          options={[
            { value: "", label: "All Branches" },
            ...(allBranches || []).map((b) => ({ value: b, label: b })),
          ]}
          value={branch}
          onValueChange={setBranch}
          placeholder="Select Branch"
          searchPlaceholder="Search branches..."
        />

        {/* Country Select - all countries with flags */}
        <SearchableSelect
          options={[
            { value: "", label: "All Countries" },
            ...getCountryOptions(),
          ]}
          value={country}
          onValueChange={setCountry}
          placeholder="Select Country"
          searchPlaceholder="Search countries..."
        />
      </div>

      {/* Active Filters Badges */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {category && category !== "All" && (
            <Badge variant="secondary" className="gap-1">
              {category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setCategory("All")}
              />
            </Badge>
          )}

          {branch && (
            <Badge variant="secondary" className="gap-1">
              {branch}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setBranch("")}
              />
            </Badge>
          )}

          {country && (
            <Badge variant="secondary" className="gap-1 flex items-center">
              <span
                className={`${getCountryFlagClass(country)} inline-block`}
                style={{ width: "1.25rem", height: "1rem" }}
              />
              {getCountryByCode(country)?.name ?? country}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setCountry("")}
              />
            </Badge>
          )}

          {verifiedOnly && (
            <Badge variant="secondary" className="gap-1">
              Verified Only
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setVerifiedOnly(false)}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Search Results Count - only when a search/filter is active */}
      {hasActiveSearch && searchResults !== undefined && (
        <div className="text-sm text-muted-foreground">
          Found {searchResults.length} {searchResults.length === 1 ? "result" : "results"}
        </div>
      )}
    </div>
  );
}
