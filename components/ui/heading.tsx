import { Lock } from "lucide-react";

interface HeadingProps {
  title: string;
  description: string;
  visibility?: string;
}

const Heading = ({ title, description, visibility }: HeadingProps) => {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="flex items-center gap-2.5 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        {title}
        {visibility === "private" ? <Lock className="w-5 h-5 text-muted-foreground" /> : ""}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground font-normal">
          {description}
        </p>
      )}
    </div>
  );
};

export default Heading;
