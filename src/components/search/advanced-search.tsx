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
import { getCountryOptions } from "@/data/countries";
import type { Id } from "../../../convex/_generated/dataModel";

interface AdvancedSearchProps {
  onResults?: (results: any[]) => void;
}

export function AdvancedSearch({ onResults }: AdvancedSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const searchResults = useQuery(
    api.search.searchProfiles,
    debouncedQuery.length >= 2
      ? {
          query: debouncedQuery,
          category: category || undefined,
          location: location || undefined,
          country: country || undefined,
          verifiedOnly: verifiedOnly || undefined,
        }
      : "skip"
  );

  const suggestions = useQuery(
    api.search.getSearchSuggestions,
    query.length >= 2 ? { query } : "skip"
  );

  const searchHistory = useQuery(
    api.search.getSearchHistory,
    user ? { userId: user._id as Id<"users">, limit: 5 } : "skip"
  );

  const allLocations = useQuery(api.search.getAllLocations);
  const allCountries = useQuery(api.search.getAllCountries);

  const saveSearch = useMutation(api.search.saveSearchHistory);
  const clearHistory = useMutation(api.search.clearSearchHistory);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.length >= 2 && user) {
        saveSearch({
          userId: user._id as Id<"users">,
          query,
          filters: { category, location, country },
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, category, location, country, user, saveSearch]);

  useEffect(() => {
    if (searchResults && onResults) {
      onResults(searchResults);
    }
  }, [searchResults, onResults]);

  const handleClearFilters = () => {
    setCategory("");
    setLocation("");
    setCountry("");
    setVerifiedOnly(false);
  };

  const handleClearHistory = async () => {
    if (user) {
      await clearHistory({ userId: user._id as Id<"users"> });
    }
  };

  const activeFiltersCount = [category, location, country, verifiedOnly].filter(Boolean).length;

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="flex items-center space-x-2 border rounded-md px-3 py-2">
          <input
            type="checkbox"
            id="verified"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="verified" className="text-sm cursor-pointer">
            Verified Only
          </label>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Construction">Construction</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Arts">Arts</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <SearchableSelect
          options={[
            { value: "", label: "All Locations" },
            ...(allLocations || []).map((loc) => ({ value: loc, label: loc })),
          ]}
          value={location}
          onValueChange={setLocation}
          placeholder="Select Location"
          searchPlaceholder="Search locations..."
        />

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

      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {category && (
            <Badge variant="secondary" className="gap-1">
              {category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setCategory("")}
              />
            </Badge>
          )}
          {location && (
            <Badge variant="secondary" className="gap-1">
              {location}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setLocation("")}
              />
            </Badge>
          )}
          {country && (
            <Badge variant="secondary" className="gap-1">
              {country}
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

      {searchResults && (
        <div className="text-sm text-muted-foreground">
          Found {searchResults.length} {searchResults.length === 1 ? "result" : "results"}
        </div>
      )}
    </div>
  );
}
