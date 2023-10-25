import "../../views/styles/fileUpload.css";

export default function FileUploader(props: {
  addFiles: (files: File[]) => void;
  uiInteractive: boolean;
}) {
	const { addFiles, uiInteractive } = props;
	return (
		<label className="fileLabel" for="test">
			<div className="fileDiv">Click or drop something here to upload</div>
			<input
				type="file"
				accept="*"
				multiple
				required
				disabled={!uiInteractive}
				onChange={(e) => {
					const input = e.target as HTMLInputElement;
					if (input.files) {
						const files = [...input.files];
						addFiles(files);
					}
				}}
			/>
		</label>
	);
}
