import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import RouteMetadata from "./components/RouteMetadata";
const Book = lazy(() => import("@/pages/Book"));
const Intake = lazy(() => import("@/pages/Intake"));
const Products = lazy(() => import("@/pages/Products"));
const Shop = lazy(() => import("@/pages/Shop"));
const Cart = lazy(() => import("@/pages/Cart"));
const Account = lazy(() => import("@/pages/Account"));
const Research = lazy(() => import("@/pages/Research"));
const Meta = lazy(() => import("@/pages/Meta"));
const Community = lazy(() => import("@/pages/Community"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense
      fallback={
        <main
          className="container min-h-screen pt-36"
          role="status"
          aria-live="polite"
        >
          <p className="mono text-sm text-muted-foreground">
            Loading Bioupgrade…
          </p>
        </main>
      }
    >
      <RouteMetadata />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/book"} component={Book} />
        <Route path={"/consultation/intake"} component={Intake} />
        <Route path={"/products"} component={Products} />
        <Route path={"/shop"} component={Shop} />
        <Route path={"/cart"} component={Cart} />
        <Route path={"/shop/:productId"} component={ProductDetail} />
        <Route path={"/research"} component={Research} />
        <Route path={"/meta"} component={Meta} />
        <Route path={"/community"} component={Community} />
        <Route path={"/documentation"} component={Documentation} />
        <Route path={"/account"} component={Account} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster theme="light" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
