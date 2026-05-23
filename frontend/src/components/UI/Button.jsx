export default function Button({
                                   children,
                                   variant = "green",
                                   type = "button",
                                   onClick,
                                   className = "",
                               }) {
    const buttonClass = variant === "blue" ? "blue-btn" : "green-btn";

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${buttonClass} ${className}`}
        >
            {children}
        </button>
    );
}