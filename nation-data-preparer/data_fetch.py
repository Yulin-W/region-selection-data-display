# Fetches relevant data for app and exports it in json format
import wbdata
import datetime
import pycountry
import json

# Dictionary to associate the tblCol fields with the correpsonding worldbank indicator code
# To get mode indicator data, add the indicator code here, and also change the corresponding key values in the app
WB_IND_CODE = {
    "pop": "SP.POP.TOTL",
    "gdpNom": "NY.GDP.MKTP.CD",
    "gdpPerCapNom": "NY.GDP.PCAP.CD",
    "landArea": "AG.LND.TOTL.K2"
}

# Dictionary to associate region names with iso 3 place codes
WB_REG_CODE = {c.name:c.alpha_3 for c in pycountry.countries}

# Some time variables for data fetching
CUR_DATE = datetime.datetime.now()
YEARS_TO_CHECK = 5 # Willing to use at the oldest data from 5 years ago, if no data then return null

# Function to attempt fetching the most recent data from World Bank
def WBDataFetch(ind_code, reg_code, cur_date, years_to_check):
    """Returns dictionary of fetched data covering the indicator codes for all regions indexed by key which is the 3 place iso code of the region
    Fetched data entries will be an dictionary for each state, containing an id field (name) and fields corresponding to the indicators
    If current year data is not found, checks next most recent data, up until years_to_check years have been checked; in which case if no result return None
    
    Args:
        ind_code: dictionary of indicator codes with key as material-ui data grid column labels, and value as the code in world bank
        reg_code: dictionary of region names (key) with region ISO 3 place codes (value)
        cur_date: datetime object for current time
        years_to_check: integer, number of years to check for data
    """
    retval = {}
    for reg_name, reg_c in reg_code.items():
        entry = {"id":reg_name}
        for ind_name, ind_c in ind_code.items():
            data = None
            for i in range(years_to_check):
                date = datetime.date(cur_date.year-i, cur_date.month, cur_date.day)
                try:
                    data = wbdata.get_data(ind_c, country=reg_c, data_date=date)
                    if data[0]["value"]:
                        break
                except: #TODO: this is a pretty bad practice, but it seems to be the easiest way to deal with the fetch data errors in the module
                    pass
            else:
                data = None
            entry[ind_name] = data[0]["value"] if data else None
        retval[reg_c] = entry
        print(reg_c, entry)
        # print(retval)
    return retval
data = WBDataFetch(WB_IND_CODE, WB_REG_CODE, CUR_DATE, YEARS_TO_CHECK)

# Output data to json
with open("data.json", "w") as f:
    json.dump(data, f)