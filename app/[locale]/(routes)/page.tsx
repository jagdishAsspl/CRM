import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import {
  CoinsIcon,
  Contact,
  DollarSignIcon,
  FilePenLine,
  FileText,
  HeartHandshakeIcon,
  LandmarkIcon,
  Megaphone,
  Target,
  UserIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

import Container from "./components/ui/Container";
import LoadingBox from "./components/dasboard/loading-box";
import StorageQuota from "./components/dasboard/storage-quota";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  getTasksCount,
  getUsersTasksCount,
} from "@/actions/dashboard/get-tasks-count";
import { getInvoicesCount } from "@/actions/dashboard/get-invoices-count";
import { getCampaignsCount } from "@/actions/dashboard/get-campaigns-count";
import { getTargetsCount } from "@/actions/dashboard/get-targets-count";
import { getLeadsCount } from "@/actions/dashboard/get-leads-count";
import { getBoardsCount } from "@/actions/dashboard/get-boards-count";
import { getStorageSize } from "@/actions/documents/get-storage-size";
import { getContactCount } from "@/actions/dashboard/get-contacts-count";
import { getAccountsCount } from "@/actions/dashboard/get-accounts-count";
import { getContractsCount } from "@/actions/dashboard/get-contracts-count";
import { getDocumentsCount } from "@/actions/dashboard/get-documents-count";
import { getActiveUsersCount } from "@/actions/dashboard/get-active-users-count";
import { getOpportunitiesCount } from "@/actions/dashboard/get-opportunities-count";
import { getExpectedRevenue } from "@/actions/crm/opportunity/get-expected-revenue";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getDefaultCurrency, formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { Decimal } from "decimal.js";

const DashboardPage = async () => {
  const session = await getSession();

  if (!session) return null;

  const userId = session?.user?.id;

  const cookieStore = await cookies();
  const defaultCurrency = await getDefaultCurrency();
  const displayCurrency = cookieStore.get("display_currency")?.value || defaultCurrency;

  //Get user language
  const lang = session?.user?.userLanguage;

  //Fetch translations and dashboard count metrics concurrently
  const [
    dict,
    leads,
    tasks,
    invoices,
    campaigns,
    targets,
    storage,
    projects,
    contacts,
    contracts,
    users,
    accounts,
    revenue,
    documents,
    opportunities,
    usersTasks,
  ] = await Promise.all([
    getTranslations("DashboardPage"),
    getLeadsCount(),
    getTasksCount(),
    getInvoicesCount(),
    getCampaignsCount(),
    getTargetsCount(),
    getStorageSize(),
    getBoardsCount(),
    getContactCount(),
    getContractsCount(),
    getActiveUsersCount(),
    getAccountsCount(),
    getExpectedRevenue(displayCurrency),
    getDocumentsCount(),
    getOpportunitiesCount(),
    getUsersTasksCount(userId),
  ]);

  return (
    <Container
      title={dict("containerTitle")}
      description={
        "Welcome to NextCRM cockpit, here you can see your company overview"
      }
    >
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 pt-2">
        <Suspense fallback={<LoadingBox />}>
          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-border/60 hover:border-emerald-500/40 group overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {dict("totalRevenue")}
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs">
                <DollarSignIcon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">{"0"}</div>
            </CardContent>
          </Card>
        </Suspense>

        <Suspense fallback={<LoadingBox />}>
          <Card className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-border/60 hover:border-purple-500/40 group overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {dict("expectedRevenue")}
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-xs">
                <DollarSignIcon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {formatCurrencyUtil(new Decimal(revenue), displayCurrency)}
              </div>
            </CardContent>
          </Card>
        </Suspense>

        <DashboardCard
          href="/admin/users"
          title={dict("activeUsers")}
          IconComponent={UserIcon}
          content={users}
          colorScheme="blue"
        />
        <DashboardCard
          href="/invoices"
          title={dict("invoices")}
          IconComponent={FileText}
          content={invoices}
          colorScheme="emerald"
        />
        <DashboardCard
          href="/campaigns"
          title={dict("campaigns")}
          IconComponent={Megaphone}
          content={campaigns}
          colorScheme="rose"
        />
        <DashboardCard
          href="/crm/targets"
          title={dict("targets")}
          IconComponent={Target}
          content={targets}
          colorScheme="indigo"
        />
        <DashboardCard
          href="/crm/accounts"
          title={dict("accounts")}
          IconComponent={LandmarkIcon}
          content={accounts}
          colorScheme="amber"
        />
        <DashboardCard
          href="/crm/opportunities"
          title={dict("opportunities")}
          IconComponent={HeartHandshakeIcon}
          content={opportunities}
          colorScheme="purple"
        />
        <DashboardCard
          href="/crm/contacts"
          title={dict("contacts")}
          IconComponent={Contact}
          content={contacts}
          colorScheme="cyan"
        />
        <DashboardCard
          href="/crm/leads"
          title={dict("leads")}
          IconComponent={CoinsIcon}
          content={leads}
          colorScheme="teal"
        />
        <DashboardCard
          href="/crm/contracts"
          title={dict("contracts")}
          IconComponent={FilePenLine}
          content={contracts}
          colorScheme="sky"
        />
        <DashboardCard
          href="/projects"
          title={dict("projects")}
          IconComponent={CoinsIcon}
          content={projects}
          colorScheme="violet"
        />
        <DashboardCard
          href="/projects/tasks"
          title={dict("tasks")}
          IconComponent={CoinsIcon}
          content={tasks}
          colorScheme="blue"
        />
        <DashboardCard
          href={`/projects/tasks/${userId}`}
          title={dict("myTasks")}
          IconComponent={CoinsIcon}
          content={usersTasks}
          colorScheme="orange"
        />
        <DashboardCard
          href="/documents"
          title={dict("documents")}
          IconComponent={CoinsIcon}
          content={documents}
          colorScheme="indigo"
        />

        <StorageQuota actual={storage} title={dict("storage")} />
      </div>
    </Container>
  );
};

export default DashboardPage;

type ColorScheme =
  | "purple"
  | "blue"
  | "emerald"
  | "amber"
  | "indigo"
  | "rose"
  | "teal"
  | "cyan"
  | "violet"
  | "sky"
  | "orange";

const colorMap: Record<
  ColorScheme,
  {
    bg: string;
    text: string;
    hoverBg: string;
    borderHover: string;
    gradient: string;
  }
> = {
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    hoverBg: "group-hover:bg-purple-600 group-hover:text-white",
    borderHover: "hover:border-purple-500/40",
    gradient: "from-purple-500 to-indigo-500",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    hoverBg: "group-hover:bg-blue-600 group-hover:text-white",
    borderHover: "hover:border-blue-500/40",
    gradient: "from-blue-500 to-cyan-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    hoverBg: "group-hover:bg-emerald-600 group-hover:text-white",
    borderHover: "hover:border-emerald-500/40",
    gradient: "from-emerald-500 to-teal-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    hoverBg: "group-hover:bg-amber-600 group-hover:text-white",
    borderHover: "hover:border-amber-500/40",
    gradient: "from-amber-500 to-orange-500",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    hoverBg: "group-hover:bg-indigo-600 group-hover:text-white",
    borderHover: "hover:border-indigo-500/40",
    gradient: "from-indigo-500 to-violet-500",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    hoverBg: "group-hover:bg-rose-600 group-hover:text-white",
    borderHover: "hover:border-rose-500/40",
    gradient: "from-rose-500 to-pink-500",
  },
  teal: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    hoverBg: "group-hover:bg-teal-600 group-hover:text-white",
    borderHover: "hover:border-teal-500/40",
    gradient: "from-teal-500 to-emerald-500",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    hoverBg: "group-hover:bg-cyan-600 group-hover:text-white",
    borderHover: "hover:border-cyan-500/40",
    gradient: "from-cyan-500 to-blue-500",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    hoverBg: "group-hover:bg-violet-600 group-hover:text-white",
    borderHover: "hover:border-violet-500/40",
    gradient: "from-violet-500 to-purple-500",
  },
  sky: {
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    hoverBg: "group-hover:bg-sky-600 group-hover:text-white",
    borderHover: "hover:border-sky-500/40",
    gradient: "from-sky-500 to-indigo-500",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    hoverBg: "group-hover:bg-orange-600 group-hover:text-white",
    borderHover: "hover:border-orange-500/40",
    gradient: "from-orange-500 to-amber-500",
  },
};

const DashboardCard = ({
  href,
  title,
  IconComponent,
  content,
  colorScheme = "purple",
}: {
  href?: string;
  title: string;
  IconComponent: any;
  content: number;
  colorScheme?: ColorScheme;
}) => {
  const styles = colorMap[colorScheme] || colorMap.purple;

  return (
    <Link href={href || "#"} className="block h-full">
      <Suspense fallback={<LoadingBox />}>
        <Card className={`h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-border/60 ${styles.borderHover} group overflow-hidden relative`}>
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {title}
            </CardTitle>
            <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} ${styles.hoverBg} transition-all duration-300 shadow-xs`}>
              <IconComponent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">{content}</div>
          </CardContent>
        </Card>
      </Suspense>
    </Link>
  );
};
