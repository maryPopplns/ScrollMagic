import { ContainerManager } from './ContainerManager';
import EventDispatcher, { ScrollMagicEvent, ScrollMagicEventType } from './EventDispatcher';
import { getElement } from './util/getElement';
import { getScrollContainerElement } from './util/getScrollContainerElement';
import { isWindow } from './util/typeguards';
import ViewportObserver from './ViewportObserver';

export interface ScrollMagicOptions {
	element: HTMLElement | string; // TODO: can we make it optional?
	container?: Window | Document | HTMLElement | string;
	vertical?: boolean;
	trackStart?: number;
	trackEnd?: number;
}

export class Scene {
	public name = 'ScrollMagic';
	private dispatcher = new EventDispatcher();
	private viewportObserver?: ViewportObserver;
	private options!: Required<ScrollMagicOptions>;
	constructor({ element, container = window, vertical = true, trackEnd = 0, trackStart = 1 }: ScrollMagicOptions) {
		const options: Required<ScrollMagicOptions> = {
			element,
			container,
			vertical,
			trackEnd,
			trackStart,
		};
		this.changeOptions(options);

		// observer.setMargin({ top: '0px', bottom: '-100%' });
		// container.onUpdate(({ top }) => {
		// 	console.log(top);
		// });
		/**
		 * 
		 * for below setters: for changes always check if they actually do change
		 // TODO: Basicaly add IC and keep the rootMargin up to date.
		 * - add IntersectionController (IC), listening to elem ✅
		 * - trigger callbacks on enter & leave ✅
		 * - add trackStart and trackEnd options ✅
		 *   - validate (start > end) ✅
		 * - recreate IC when trackStart or trackEnd is set (setter) ✅
		 * - introduce offset (getter, setter)
		 * - when offset changes:
		 * 	 - recreate IC
		 *   - if (offset !== 0):
		 *      - use calculated px rootMargin based on trackStart, offset & current viewport height/width
		 * 		- listen for container resizes -> recreate IC
		 * - introduce height (getter, setter)
		 * - when height changes:
		 *   - recreate IC
		 * 	 - if (height !== 100% aber relativ (%)):
		 * 		- add ResizeObserver for element, recreate IC on height/width change
		 * - test all
		 * - next big thing: calclate progress during scene
		 */
	}

	public destroy(): void {
		this.viewportObserver?.disconnect();
		ContainerManager.detach(this);
	}

	private refreshViewportObserver(): void {
		const { container, element, vertical, trackEnd, trackStart } = this.options;
		const containerElement = getScrollContainerElement(container);
		ContainerManager.attach(this, containerElement);
		const triggerElement = getElement(element);
		const start = `${trackStart * 100 - 100}%`;
		const end = `${-trackEnd * 100}%`;
		const margin = {
			top: vertical ? end : 0,
			left: vertical ? 0 : end,
			bottom: vertical ? start : 0,
			right: vertical ? 0 : start,
		};
		const observerOptions = {
			margin,
			root: isWindow(containerElement) ? null : containerElement,
		};
		if (undefined === this.viewportObserver) {
			this.viewportObserver = new ViewportObserver(([entry]) => {
				this.trigger(entry.isIntersecting ? ScrollMagicEventType.Enter : ScrollMagicEventType.Leave);
			}, observerOptions);
		} else {
			this.viewportObserver.updateOptions(observerOptions);
		}
		this.viewportObserver.observe(triggerElement);
	}
	private validateOptions(options: Partial<ScrollMagicOptions>): void {
		const { trackEnd, trackStart } = {
			...this.options,
			...options,
		};
		if (trackEnd > trackStart) {
			throw "ViewportObserver doesn't work with this"; // TODO: figure out workaround?
		}
	}
	public changeOptions(options: Partial<ScrollMagicOptions>): Scene {
		this.validateOptions(options);
		this.options = {
			...this.options,
			...options,
		};
		this.refreshViewportObserver();
		return this;
	}

	// getter / setter
	public set element(element: Required<ScrollMagicOptions>['element']) {
		this.changeOptions({ element });
	}
	public get element(): Required<ScrollMagicOptions>['element'] {
		return this.options.element;
	}
	public set container(container: Required<ScrollMagicOptions>['container']) {
		this.changeOptions({ container });
	}
	public get container(): Required<ScrollMagicOptions>['container'] {
		return this.options.container;
	}
	public set vertical(vertical: Required<ScrollMagicOptions>['vertical']) {
		this.changeOptions({ vertical });
	}
	public get vertical(): Required<ScrollMagicOptions>['vertical'] {
		return this.options.vertical;
	}
	public set trackStart(trackStart: Required<ScrollMagicOptions>['trackStart']) {
		this.changeOptions({ trackStart });
	}
	public get trackStart(): Required<ScrollMagicOptions>['trackStart'] {
		return this.options.trackStart;
	}
	public set trackEnd(trackEnd: Required<ScrollMagicOptions>['trackEnd']) {
		this.changeOptions({ trackEnd });
	}
	public get trackEnd(): Required<ScrollMagicOptions>['trackEnd'] {
		return this.options.trackEnd;
	}

	// event listener
	public on(type: ScrollMagicEventType, cb: (e: ScrollMagicEvent) => void): Scene {
		this.dispatcher.addEventListener(type, cb);
		return this;
	}
	public off(type: ScrollMagicEventType, cb: (e: ScrollMagicEvent) => void): Scene {
		this.dispatcher.removeEventListener(type, cb);
		return this;
	}
	private trigger(type: ScrollMagicEventType) {
		// public?
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(type));
	}
}
