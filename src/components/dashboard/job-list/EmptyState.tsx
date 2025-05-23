
interface EmptyStateProps {
  message: string;
  description: string;
}

export const EmptyState = ({ message, description }: EmptyStateProps) => {
  return (
    <div className="text-center py-10">
      <h3 className="text-xl font-medium text-gray-500">{message}</h3>
      <p className="text-gray-400 mt-2">{description}</p>
    </div>
  );
};
