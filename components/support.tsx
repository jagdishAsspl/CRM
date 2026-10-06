"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { HelpCircle } from "lucide-react";
import { Button } from "./ui/button";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

const SupportComponent = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Support">
          <HelpCircle className="cursor-pointer w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex flex-col space-y-2 mt-3 min-w-[400px]"
        align={"end"}
      >
        <div className="flex w-full justify-between items-center gap-2">
          <span className="text-sm">Need help? Join us on</span>
          <Button asChild variant={"secondary"}>
            <a
              className="border rounded-md p-2"
              href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordLogoIcon />
            </a>
          </Button>
        </div>
        <div className="flex w-full justify-between items-center gap-2">
          <span className="text-sm "> Find a bug? Create an issue on</span>
          <Button asChild variant={"secondary"}>
            <a
              className="border rounded-md p-2"
              href={process.env.NEXT_PUBLIC_GITHUB_ISSUES_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubLogoIcon />
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SupportComponent;
