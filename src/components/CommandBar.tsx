import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  CalendarIcon,
  FileTextIcon,
  CheckSquareIcon,
  RepeatIcon,
  PersonIcon,
} from "@radix-ui/react-icons";

export function CommandBar() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => unknown) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/journal"))}>
            <FileTextIcon className="mr-2 h-4 w-4" />
            <span>Journal</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/tasks"))}>
            <CheckSquareIcon className="mr-2 h-4 w-4" />
            <span>Tasks</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/habits"))}>
            <RepeatIcon className="mr-2 h-4 w-4" />
            <span>Habits</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/workouts"))}>
            <PersonIcon className="mr-2 h-4 w-4" />
            <span>Workouts</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
