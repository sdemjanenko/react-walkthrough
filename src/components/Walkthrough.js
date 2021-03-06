import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';

import style from './Walkthrough.module.scss';


class BeaconPortal extends React.Component {
    render() {
        const {beacons, openBeacon} = this.props;

        return (
            <div style={{position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, pointerEvents: 'none'}}>
                 {beacons.map((beacon, ix) => {
                     const position = beacon.get('measure')();

                     return (
                         <div
                            key={ix}
                            className={style.outerBeacon}
                            style={{top: position.get('top'), left: position.get('left')}}
                            onClick={() => openBeacon(beacon)}>
                                <div className={style.innerBeacon}></div>
                        </div>
                     );
                 })}
            </div>
        );
    }
}


export default class Walkthrough extends React.Component {
    static childContextTypes = {
        addBeacon: React.PropTypes.func,
        updateBeacon: React.PropTypes.func,
        removeBeacon: React.PropTypes.func,

        // addModal: React.PropTypes.func,
        // updateModal: React.PropTypes.func,
        // removeModal: React.PropTypes.func
    };

    state = {
        beacons: Immutable.List.of(),
        modals: Immutable.List.of(),
        openBeacon: false,
        current: '',
        seen: Immutable.Set.of()
    };

    constructor(props) {
        super(props);

        this.closeBeacon = this.closeBeacon.bind(this);
    }

    getChildContext() {
        return {
            addBeacon: this.addBeacon,
            updateBeacon: this.updateBeacon,
            removeBeacon: this.removeBeacon,

            // addModal: this.addModal,
            // updateModal: this.updateModal,
            // removeModal: this.removeModal
        };
    }

    addBeacon = (beacon) => {
        this.setState(previousState => {
            return {...previousState, beacons: previousState.beacons.push(beacon)};
        });
    };

    updateBeacon = (beacon) => {
        this.setState(previousState => {
            return {
                ...previousState,
                beacons: previousState.beacons.map(previousBeacon => (
                    previousBeacon.get('id') === beacon.get('id') ? beacon : previousBeacon
                ))
            };
        });
    };

    removeBeacon = (id) => {
        this.setState(previousState => {
            return {...previousState, beacons: previousState.beacons.filter(beacon => beacon.get('id') !== id)}
        });
    };

    addModal = (modal) => {
        this.setState(previousState => {
            return {...previousState, modals: previousState.modals.push(modal)}
        });
    };

    updateModal = (modal) => {
        this.setState(previousState => (
            {
                ...previousState,
                modals: previousState.modals.map(previousModal => (
                    perviousModal.get('id') === modal.get('id') ? modal : previousModal
                ))
            }
        ));
    };

    removeModal = (id) => {
        this.setState(previousState => (
            {...previousState, modals: previousState.modals.filter(modal => modal.get('id') !== id)}
        ));
    };

    openBeacon = (beacon) => {
        const {seen} = this.state;

        this.setState({openBeacon: true, current: beacon.get('id')});

        const position = beacon.get('measure')();

        ReactDOM.render(
            <div className={style.overlay}>
                <div style={{position: 'fixed', width: '100%', height: '100%', cursor: 'pointer'}} onClick={this.closeBeacon}>
                </div>
                <div
                    className={style.highlight}
                    style={{
                        top: position.get('top') - 2,
                        left: position.get('left') - 2,
                        width: position.get('width') + 4,
                        height: position.get('height') + 4
                    }}>
                </div>
                <div className={style.infoBox} style={{top: position.get('bottom') + 12, left: position.get('left')}}>
                    <div className={style.caret}></div>
                    <div className={style.content}>
                        <h3 style={{margin: 0}}>{beacon.get('title')}</h3>
                        <div className={style.divider} />
                        <p>{beacon.get('description')}</p>
                        <button onClick={this.closeBeacon}>Close</button>
                    </div>
                </div>
            </div>,
            this._overlay
        );
    };

    closeBeacon = () => {
        this.setState({openBeacon: false, current: '', seen: this.state.seen.add(this.state.current)});
        ReactDOM.unmountComponentAtNode(this._overlay);
    };

    renderBeacons = () => {
        const {beacons, seen, current} = this.state;

        ReactDOM.render(
            <BeaconPortal
                beacons={beacons.filter(beacon => (
                    beacon.get('condition') &&
                    !seen.includes(beacon.get('id')) &&
                    beacon.get('requires').every(requirement => seen.includes(requirement)) &&
                    current !== beacon.get('id')
                ))}
                openBeacon={this.openBeacon} />,
            this._beacons
        );
    };

    componentWillMount() {
        this._beacons = document.createElement('div');
        this._beacons.className = 'react-walkthrough-beacons';
        document.body.appendChild(this._beacons);

        this._overlay = document.createElement('div');
        this._overlay.className = 'react-walkthrough-overlay';
        document.body.appendChild(this._overlay);

        // this._modals = document.createElement('div');
        // this._modals.className = 'react-walkthrough-modals';
        // document.body.appendChild(this._modals);

        this.renderBeacons();

        window.addEventListener('resize', this.renderBeacons);
    }

    componentWillUnmount() {
        const {openBeacon} = this.state;

        window.removeEventListener('resize', this.renderBeacons);

        ReactDOM.unmountComponentAtNode(this._beacons);
        if (openBeacon) ReactDOM.unmountComponentAtNode(this._overlay);
        document.body.removeChild(this._beacons);
        document.body.removeChild(this._overlay);
        // document.body.removeChild(this._modals);
    }

    componentDidUpdate(prevProps, prevState) {
        this.renderBeacons();
    }

    render() {
        return React.Children.only(this.props.children);
    }
}
