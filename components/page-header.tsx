export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 h-1 w-10 rounded-full bg-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="grid min-w-0 w-full gap-2 [&>*]:min-w-0 [&>*]:max-w-full [&>*]:w-full sm:flex sm:w-auto sm:items-center sm:[&>*]:w-auto">
          {children}
        </div>
      )}
    </div>
  )
}
