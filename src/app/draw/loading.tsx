import Spinner from "@/components/ui/Spinner";

const Loading = () => {
    // WORKAROUND: loading pages for components that use localStorage will throw errors, this should prevent that
    const localStorage:Storage | null = null;
    return <div className="centerscreen"><Spinner size="6rem"/></div>
}

export default Loading;