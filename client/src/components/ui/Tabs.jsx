import React from 'react';

const Tabs = ({ defaultValue, value, onValueChange, children, className = '' }) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue);

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleTabChange = (val) => {
    setActiveTab(val);
    if (onValueChange) {
      onValueChange(val);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, onTabChange: handleTabChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, onTabChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ value, activeTab, onTabChange, children, className = '' }) => {
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      onClick={() => onTabChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-zinc-950 shadow-sm font-semibold' 
          : 'hover:bg-white/50 hover:text-zinc-900'
      } ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, activeTab, children, className = '' }) => {
  if (activeTab !== value) return null;
  return <div className={`mt-2 focus-visible:outline-none ${className}`}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
