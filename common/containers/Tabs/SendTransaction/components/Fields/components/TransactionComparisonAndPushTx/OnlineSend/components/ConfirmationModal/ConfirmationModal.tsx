import Modal, { IButton } from 'components/ui/Modal';
import Spinner from 'components/ui/Spinner';
import { Details, Summary } from './components';
import React from 'react';
import { connect } from 'react-redux';
import { getLanguageSelection } from 'selectors/config';
import {
  broadcastLocalTransactionRequested,
  TBroadcastLocalTransactionRequested
} from 'actions/transaction';
import {
  currentTransactionBroadcasting,
  currentTransactionBroadcasted
} from 'selectors/transaction';
import translate, { translateRaw } from 'translations';
import './ConfirmationModal.scss';
import { AppState } from 'reducers';

interface DispatchProps {
  broadcastLocalTransactionRequested: TBroadcastLocalTransactionRequested;
}
interface StateProps {
  lang: string;
  transactionBroadcasting: boolean;
  transactionBroadcasted: boolean;
}
interface OwnProps {
  onClose(): void;
}
interface State {
  timeToRead: number;
}

type Props = DispatchProps & StateProps & OwnProps;

class ConfirmationModalClass extends React.Component<Props, State> {
  public state = {
    timeToRead: 5
  };

  private readTimer = 0;

  public componentDidUpdate() {
    if (this.props.transactionBroadcasted) {
      this.props.onClose();
    }
  }

  // Count down 5 seconds before allowing them to confirm
  public componentDidMount() {
    this.readTimer = window.setInterval(() => {
      if (this.state.timeToRead > 0) {
        this.setState({ timeToRead: this.state.timeToRead - 1 });
      } else {
        window.clearInterval(this.readTimer);
      }
    }, 1000);
  }

  public render() {
    const { onClose, transactionBroadcasting } = this.props;
    const { timeToRead } = this.state;

    const buttonPrefix = timeToRead > 0 ? `(${timeToRead}) ` : '';
    const buttons: IButton[] = [
      {
        text: buttonPrefix + translateRaw('SENDModal_Yes'),
        type: 'primary',
        disabled: timeToRead > 0,
        onClick: this.confirm
      },
      {
        text: translateRaw('SENDModal_No'),
        type: 'default',
        onClick: onClose
      }
    ];

    return (
      <div className="ConfModalWrap">
        <Modal
          title="Confirm Your Transaction"
          buttons={buttons}
          handleClose={onClose}
          disableButtons={transactionBroadcasting}
          isOpen={true}
        >
          <div className="ConfModal">
            {transactionBroadcasting ? (
              <div className="ConfModal-loading">
                <Spinner size="x5" />
              </div>
            ) : (
              <div>
                <Summary />
                <Details />

                <div className="ConfModal-confirm">
                  {translate('SENDModal_Content_3')}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  public componentWillUnmount() {
    window.clearInterval(this.readTimer);
  }

  private confirm = () => {
    if (this.state.timeToRead < 1) {
      this.props.broadcastLocalTransactionRequested();
    }
  };
}

export const ConfirmationModal = connect(
  (state: AppState) => ({
    transactionBroadcasting: currentTransactionBroadcasting(state),
    transactionBroadcasted: currentTransactionBroadcasted(state),
    lang: getLanguageSelection(state)
  }),
  { broadcastLocalTransactionRequested }
)(ConfirmationModalClass);
