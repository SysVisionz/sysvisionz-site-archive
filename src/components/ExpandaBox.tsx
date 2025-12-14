import { useEffect, useRef, useState } from "react";
import style from './scss/ExpandaBox.module.scss'
import { isDiff, classNamer, useDelay } from "~/shared/utils";

const ExpandaBox: FCWC<{open: boolean, className: string, orientation?: 'right' | 'left'}> = ({children, open, className, orientation = 'right'}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [dimensions, setTheDimensions] = useState<{height: number, width: number, padding: number}>({height: 0, width: 0, padding: 0});
	const setDimensions = useDelay(() => {
		if (ref.current){
			setTheDimensions({
				height: open ? ref.current.clientHeight: 0,
				width: open ? ref.current.clientWidth: 0,
				padding: open ? 5: 0,
			});
		}
	})
	const observer = useRef<ResizeObserver | null>(null);
	useEffect(() => {
		let observe = observer.current
		const refer = ref.current
		if (!observe && refer){
			observer.current = new ResizeObserver(() => {
				const {height, width} = dimensions;
				const {clientWidth, clientHeight} = ref.current || {}
				if (open && isDiff([clientWidth, width], [clientHeight, height], 15)){
					setDimensions();
				}
			})
			observe = observer.current
		}
		if (refer){
			observe!.observe(refer)
		}
		setDimensions();
		
		return () => {
			if (observe && refer){
				observe.unobserve(refer);
			}
		}
	}, [open]);
	return (
	<div className={classNamer(style.container, orientation, className)} style={{...dimensions}}>
		<div className={style.content} ref={ref}>
			{children}
		</div>
	</div>
  );
}

export default ExpandaBox;