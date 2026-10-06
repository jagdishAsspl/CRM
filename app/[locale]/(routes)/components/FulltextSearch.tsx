"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const FulltextSearch = () => {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = async () => {
    router.push(`/fulltext-search?q=${search}`);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      handleSearch();
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="text"
        placeholder={"Search something ..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-9 rounded-lg bg-muted/50 focus-visible:bg-background transition-colors"
      />
      <Button
        type="button"
        size="sm"
        className="gap-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
        onClick={handleSearch}
      >
        <span className="hidden sm:inline">Search</span>
        <SearchIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default FulltextSearch;
